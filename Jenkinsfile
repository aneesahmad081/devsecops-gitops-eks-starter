
pipeline {
    agent {
        label 'docker-ci'
    }

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        IMAGE_NAME = 'devsecops-status-api'
        DOCKER_HOST = 'tcp://docker:2376'
        DOCKER_TLS_VERIFY = '1'
        DOCKER_CERT_PATH = '/certs/client'
        AWS_REGION = 'us-east-1'
        ECR_REPOSITORY = 'devsecops-status-api'

    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'docker version'
            }
        }

        stage('Code Validation') {
            steps {
                dir('app') {
                    sh 'npm run check'
                }
            }
        }

        stage('Unit Testing') {
            steps {
                dir('app') {
                    sh 'npm test'
                }
            }
        }

        
        
stage('SonarQube Analysis & Quality Gate') {
    steps {
        timeout(time: 10, unit: 'MINUTES') {
            script {
                def scannerHome = tool 'SonarScanner'

                withSonarQubeEnv('SonarQube-Local') {
                    sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.qualitygate.wait=true \
                        -Dsonar.qualitygate.timeout=300
                    """
                }
            }
        }
    }
}




        stage('Docker Image Build') {
            steps {
                sh '''
                    docker build \
                      -t "$IMAGE_NAME:ci-$BUILD_NUMBER" \
                      ./app
                '''
            }
        }

        stage('Docker Image Verify') {
            steps {
                sh '''
                    docker image inspect \
                      "$IMAGE_NAME:ci-$BUILD_NUMBER"

                    docker run --rm \
                      --entrypoint node \
                      "$IMAGE_NAME:ci-$BUILD_NUMBER" \
                      --check src/index.js
                '''
            }
        }

        stage('Container Smoke Test') {
            steps {
                sh '''
                    set -eu

                    CONTAINER="status-api-smoke-$BUILD_NUMBER"

                    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

                    trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT

                    docker run -d \
                      --name "$CONTAINER" \
                      "$IMAGE_NAME:ci-$BUILD_NUMBER"

                    for i in 1 2 3 4 5 6 7 8 9 10; do
                        if docker exec "$CONTAINER" node -e "require('node:http').get('http://127.0.0.1:3000/health/ready', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"; then
                            echo "SMOKE TEST PASSED: HTTP 200"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "SMOKE TEST FAILED"
                    docker logs "$CONTAINER" || true
                    exit 1
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh '''
                    set -eu

                    echo "Starting automated Trivy security scan..."

                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock:ro \
                      -v trivy_ci_cache:/root/.cache/ \
                      ghcr.io/aquasecurity/trivy:0.76.2 image \
                      --image-src docker \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --table-mode summary \
                      --exit-code 1 \
                      "$IMAGE_NAME:ci-$BUILD_NUMBER"

                    echo "SECURITY GATE PASSED: No HIGH or CRITICAL vulnerabilities detected."
                '''
            }
        }

stage('Push Docker Image to Amazon ECR') {
    steps {
        withCredentials([[
            $class: 'AmazonWebServicesCredentialsBinding',
            credentialsId: 'aws-ecr-push'
        ]]) {
            sh '''
                set -eu
                set +x

                echo "Starting secure Amazon ECR image publishing..."

                AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

                ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

                ECR_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:ci-${BUILD_NUMBER}"

                export DOCKER_CONFIG="$(mktemp -d)"
                trap 'rm -rf "$DOCKER_CONFIG"' EXIT

                echo "Authenticating to Amazon ECR..."

                aws ecr get-login-password --region "$AWS_REGION" |
                    docker login --username AWS --password-stdin "$ECR_REGISTRY"

                echo "Tagging verified Docker image..."

                docker tag "$IMAGE_NAME:ci-$BUILD_NUMBER" "$ECR_IMAGE"

                echo "Publishing verified image to Amazon ECR..."

                docker push "$ECR_IMAGE"

                echo "ECR PUSH SUCCESS: ${ECR_REPOSITORY}:ci-${BUILD_NUMBER}"
            '''
        }
    }

        stage('Promote Image to GitOps') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'github-gitops-token',
                        variable: 'GITHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu
                        set +x
                        umask 077

                        echo "Starting GitOps image promotion..."

                        IMAGE_TAG="ci-${BUILD_NUMBER}"
                        GITOPS_REPO="https://github.com/aneesahmad081/devsecops-gitops-eks-starter.git"

                        TEMP_DIR="$(mktemp -d)"
                        trap 'rm -rf "$TEMP_DIR"' EXIT

                        cat > "$TEMP_DIR/askpass.sh" <<'ASKPASS'
#!/bin/sh
case "$1" in
    *Username*) printf '%s\\n' "x-access-token" ;;
    *Password*) printf '%s\\n' "$GITHUB_TOKEN" ;;
    *) exit 1 ;;
esac
ASKPASS

                        chmod 700 "$TEMP_DIR/askpass.sh"
                        export GIT_ASKPASS="$TEMP_DIR/askpass.sh"
                        export GIT_TERMINAL_PROMPT=0

                        echo "Cloning GitOps branch..."

                        git -c credential.helper= clone \
                            --quiet \
                            --depth 1 \
                            --branch gitops \
                            "$GITOPS_REPO" \
                            "$TEMP_DIR/repo"

                        cd "$TEMP_DIR/repo"

                        VALUES_FILE="charts/status-api/values-eks.yaml"

                        test -f "$VALUES_FILE"

                        grep -Eq '^  tag: ' "$VALUES_FILE" || {
                            echo "ERROR: Image tag field not found."
                            exit 1
                        }

                        sed -i -E \
                            "s|^  tag: .*|  tag: \\"$IMAGE_TAG\\"|" \
                            "$VALUES_FILE"

                        grep -F "tag: \\"$IMAGE_TAG\\"" \
                            "$VALUES_FILE" >/dev/null

                        git diff --check

                        if git diff --quiet -- "$VALUES_FILE"; then
                            echo "Image already promoted: $IMAGE_TAG"
                            exit 0
                        fi

                        git config user.name "Jenkins GitOps Bot"
                        git config user.email "jenkins-gitops@users.noreply.github.com"

                        git add "$VALUES_FILE"

                        git commit -m \
                            "chore(gitops): promote status-api to $IMAGE_TAG"

                        echo "Pushing updated image tag..."

                        git -c credential.helper= push origin HEAD:gitops

                        echo "GITOPS PROMOTION SUCCESS: $IMAGE_TAG"
                    '''
                }
            }
        }

}

    }

    post {
        success {
            echo 'SUCCESS: Tests, Docker build, smoke test and Trivy security scan passed!'
        }

        failure {
            echo 'FAILED: Check Jenkins console output for pipeline or security errors.'
        }
    }
}
