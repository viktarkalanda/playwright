pipeline {
  // Run on the Jenkins controller (jenkins Docker container)
  agent any

  options {
    // Timestamps in console output
    timestamps()
  }

  environment {
    NODE_ENV = 'test'
    ALLURE_DOCKER_URL = 'http://allure-docker-service:5050/allure-docker-service'
    ALLURE_PROJECT_ID = 'playwright-regression'
  }

  stages {
    stage('Checkout') {
      steps {
        // Checkout repository from SCM configured in the job
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        // Just to see current state before install
        sh '''
          node -v || echo "Node is not installed yet"
          npm -v || echo "npm is not installed yet"
        '''

        // Install Node.js 20 inside the Jenkins container if it's missing
        sh '''
          if ! command -v node >/dev/null 2>&1; then
            echo "Installing Node.js 20..."
            apt-get update
            apt-get install -y curl
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
          fi

          if ! command -v zip >/dev/null 2>&1; then
            echo "Installing zip..."
            apt-get update
            apt-get install -y zip
          fi

          node -v
          npm -v

          npm ci
          npx playwright install --with-deps
        '''
      }
    }

    stage('Lint') {
      steps {

        script {
          catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh 'npm run lint'
          }
        }
      }
    }

    stage('Clean reports') {
      steps {
        // Чистим старые репорты перед запуском тестов
        sh '''
          rm -rf allure-results allure-report playwright-report || true
        '''
      }
    }

    stage('Test') {
      steps {
        sh 'npx playwright test'
      }
    }

    stage('Upload Allure results to Allure Docker Service') {
      steps {
        sh '''
          if [ ! -d "allure-results" ]; then
            echo "No allure-results directory found, skipping upload."
            exit 0
          fi

          rm -f allure-results.zip
          zip -r allure-results.zip allure-results

          if ! curl -sf -X POST "$ALLURE_DOCKER_URL/send-results" -F "results=@allure-results.zip" -F "project_id=$ALLURE_PROJECT_ID"; then
            echo "Failed to send Allure results to Allure Docker Service"
          fi

          if ! curl -sf "$ALLURE_DOCKER_URL/generate-report?project_id=$ALLURE_PROJECT_ID"; then
            echo "Failed to trigger Allure report generation"
          fi
        '''
      }
    }
  }

  post {
    always {
      // Archive Playwright HTML report
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, allowEmptyArchive: true

      // Archive Allure raw results
      archiveArtifacts artifacts: 'allure-results/**', fingerprint: true, allowEmptyArchive: true

      // Publish Allure report (requires Allure Jenkins Plugin + Allure Commandline tool)
      allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
    }
  }
}
