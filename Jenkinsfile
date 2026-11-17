
pipeline {
    agent any

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

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Node.js') {
            steps {
                sh 'node --version'
                sh 'npm --version'
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
    }

    post {
        success {
            echo 'SUCCESS: All Jenkins CI checks passed!'
        }

        failure {
            echo 'FAILED: Check the Jenkins console output.'
        }
    }
}
