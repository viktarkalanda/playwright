pipeline {
  // Run on the Jenkins controller (jenkins Docker container)
  agent any

  options {
    // Timestamps in console output
    timestamps()
  }

  environment {
    NODE_ENV = 'test'
    // URL Allure Docker Service внутри docker-сети
    ALLURE_DOCKER_URL = 'http://allure-docker-service:5050'
    // проект в Allure Docker Service (используем default)
    ALLURE_PROJECT_ID = 'default'
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
          // Линт может падать, но пайплайн не останавливаем
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
          // Тесты могут падать, но последующие стадии всё равно выполняем
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

          RESULT_COUNT=$(find allure-results -type f | wc -l)
          if [ "$RESULT_COUNT" -eq 0 ]; then
            echo "allure-results directory is empty (tests may not have run), skipping upload."
            exit 0
          fi

          echo "Packing allure-results into zip ($RESULT_COUNT files)..."
          rm -f allure-results.zip
          zip -r allure-results.zip allure-results

          echo ">>> Sending results to Allure Docker Service..."
          curl -s -X POST "$ALLURE_DOCKER_URL/send-results" \
            -F "files[]=@allure-results.zip" \
            -F "project_id=$ALLURE_PROJECT_ID" \
            -F "project_name=$ALLURE_PROJECT_ID" \
            || echo "Failed to send Allure results"

          echo ">>> Generating report (may respond 'Processing files, try later')..."
          curl -s "$ALLURE_DOCKER_URL/generate-report?project_id=$ALLURE_PROJECT_ID" \
            || echo "Failed to generate report"

          echo ">>> Open latest Allure Docker Service report at:"
          echo "http://localhost:5050/allure-docker-service/projects/$ALLURE_PROJECT_ID/reports/latest/index.html"
        '''
      }
    }
  }

  post {
    always {
      // Playwright HTML report
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, allowEmptyArchive: true

      // Allure raw results
      archiveArtifacts artifacts: 'allure-results/**', fingerprint: true, allowEmptyArchive: true

      // Allure report через Jenkins-плагин
      allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
    }
  }
}
