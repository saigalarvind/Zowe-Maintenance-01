pipeline {
    agent { label 'zowe-agent' }
    environment {
        // z/OSMF Connection Details
        ZOWE_OPT_HOST=credentials('eosHost')
        ZOWE_OPT_PORT="443"
        ZOWE_OPT_REJECT_UNAUTHORIZED=false

        // File Master Plus Connection Details
        FMP="--port 6001 --protocol http --reject-unauthorized false"
    }
    stages {
        stage('local setup') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'zowe --version'
                sh 'zowe plugins list'
                sh 'npm install gulp-cli -g'
                sh 'npm install'
            }
        }
        stage('Upload Maintenance') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo Upload Maintenance'
                }
            }
        }
        stage('Receive') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo Receive'
                }
            }
        }
        stage('Apply-Check') {
            input {
                message "Proceed to Apply-Check?"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo Apply-Check'
                }
            }
        }
        stage('Apply') {
            input {
                message "Proceed to Apply?"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo Apply'
                }
            }
        }
        stage('Deploy') {
            input {
                message "Proceed to Deploy?"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    //To deploy the maintenace, an OPS profile needs to be created since profile options are not exposed on the command line
                    sh 'zowe profiles create ops Jenkins --host $ZOWE_OPT_HOST --port 6007 --protocol http --user $ZOWE_OPT_USER --password $ZOWE_OPT_PASSWORD'
                    sh 'echo Deploy'
                }
            }
        }
        stage('Test') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo Test'
                }
            }
        }
    }

    // post {
    //     always {
    //         publishHTML([allowMissing: false,
    //             alwaysLinkToLastBuild: true,
    //             keepAll: true,
    //             reportDir: 'mochawesome-report',
    //             reportFiles: 'mochawesome.html',
    //             reportName: 'Test Results',
    //             reportTitles: 'Test Report'
    //             ])
    //     }
    // }
}