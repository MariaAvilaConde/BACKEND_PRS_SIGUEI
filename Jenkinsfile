pipeline {
    agent any

    environment {
        // URL del Webhook de Slack.
        // Reemplaza este valor por tu webhook real de Slack.
        SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/TU/WEBHOOK/AQUI'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Clonando el repositorio desde GitHub...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Compilando el proyecto con Maven...'
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Test') {
            steps {
                echo 'Ejecutando pruebas unitarias...'
                sh 'mvn test'
            }
        }

        stage('Code Quality') {
            steps {
                echo 'Analizando calidad del código...'
                sh 'mvn verify'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Desplegando la aplicación...'
                sh 'echo "Aplicación desplegada correctamente."'
            }
        }
    }

    post {
        success {
            echo 'Pipeline ejecutado exitosamente.'
            sh """
                curl -X POST -H 'Content-type: application/json' \
                --data '{
                    "text":"✅ Jenkins: El pipeline finalizó correctamente en ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                }' \
                ${SLACK_WEBHOOK_URL}
            """
        }

        failure {
            echo 'El pipeline falló.'
            sh """
                curl -X POST -H 'Content-type: application/json' \
                --data '{
                    "text":"❌ Jenkins: El pipeline falló en ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                }' \
                ${SLACK_WEBHOOK_URL}
            """
        }

        unstable {
            echo 'El pipeline terminó con advertencias.'
            sh """
                curl -X POST -H 'Content-type: application/json' \
                --data '{
                    "text":"⚠️ Jenkins: El pipeline terminó como UNSTABLE en ${env.JOB_NAME} #${env.BUILD_NUMBER}"
                }' \
                ${SLACK_WEBHOOK_URL}
            """
        }

        always {
            echo 'Pipeline finalizado.'
        }
    }
}