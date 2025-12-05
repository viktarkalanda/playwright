pipeline {
  // Run on the Jenkins controller (jenkins Docker container)
  agent any

  options {
    // Timestamps in console output
    timestamps()
  }

  environment {
    NODE_ENV = 'test'
    ALLURE_DOCKER_URL = 'http://allure-docker-service:5050'
    ALLURE_PROJECT_ID = 'playwright-regression'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh '''
          node -v || echo "Node is not installed yet"
          npm -v || echo "npm is not installed yet"
        '''

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
        sh '''
          rm -rf allure-results allure-report playwright-report || true
        '''
      }
    }

    stage('Test') {
      steps {
        script {
          catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh 'npx playwright test'
          }
        }
      }
    }

    stage('Upload Allure results to Allure Docker Service') {
      steps {
        sh '''
          if [ ! -d "allure-results" ]; then
            echo "No allure-results directory found, skipping upload."
            exit 0
          fi

          echo "Packing allure-results into zip..."
          rm -f allure-results.zip
          zip -r allure-results.zip allure-results

          echo ">>> Sending results to Allure Docker Service..."
          # ВАЖНО: поле files[] + project_name, как того просит сервер
          curl -v -X POST "$ALLURE_DOCKER_URL/send-results" \
            -F "files[]=@allure-results.zip" \
            -F "project_id=$ALLURE_PROJECT_ID" \
            -F "project_name=$ALLURE_PROJECT_ID" \
            || echo "Failed to send Allure results"

          echo ">>> Generating report..."
          curl -v "$ALLURE_DOCKER_URL/generate-report?project_id=$ALLURE_PROJECT_ID" \
            || echo "Failed to generate report"
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'allure-results/**', fingerprint: true, allowEmptyArchive: true

      allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
    }
  }
}
