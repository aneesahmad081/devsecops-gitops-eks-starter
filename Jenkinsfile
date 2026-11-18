
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
