pipeline {
    agent { label 'zowe-agent' }
    environment {
        // z/OS Host Information
        ZOWE_OPT_HOST=credentials('eosHost')            
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

                //Create zosmf profile, env vars will provide host, user, and password details
                sh 'zowe profiles create zosmf Jenkins --port 443 --ru false --host dummy --user dummy --password dummy'
            }
        }
        stage('Download Maintenance') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo download'
                }
            }
        }
        stage('Upload Maintenance') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo upload'
                }
            }
        }
        stage('Receive') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo receive'
                }
            }
        }
        stage('Apply-Check') {
            steps {
                // script {
                //     def actions = readJSON file: 'holddata/actions.json'
                //     if (actions.remainingHolds) {
                //         input message: 'Unresolved holds detected. Please review the results of the receive job in the job-archive/receive artifacts. Proceed to Apply-Check?'
                //     }
                // }
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo apply-check'
                }
            }
        }
        stage('Apply') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo apply'
                }
            }
        }
        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    //To deploy the maintenace, an OPS profile needs to be created since profile options are not exposed on the command line
                    sh 'zowe profiles create ops Jenkins --host $ZOWE_OPT_HOST --port 6007 --protocol https --user $ZOWE_OPT_USER --password $ZOWE_OPT_PASSWORD'
                    echo 'deploy'

                    // script {
                    //     def actions = readJSON file: 'holddata/actions.json'
                    //     if (actions.restart) {
                    //         sh 'gulp restartWorkflow'
                    //     }
                    // }
                }
            }
        }
        stage('Test') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'echo test'
                }
            }
        }
    }
    // post {
    //     always {
    //         archiveArtifacts artifacts: '*-archive/**/*.*, holddata/actions.json' 
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