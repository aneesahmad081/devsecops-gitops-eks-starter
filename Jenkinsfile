
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
                '''

                sh '''
                    docker run --rm \
                      --entrypoint node \
                      "$IMAGE_NAME:ci-$BUILD_NUMBER" \
                      --check src/index.js
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Tests and Docker image build passed!'
        }

        failure {
            echo 'FAILED: Check the Jenkins console output.'
        }
    }
}
