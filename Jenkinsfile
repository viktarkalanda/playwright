pipeline {
  // Runs on the Jenkins controller.
  // To use the official Playwright Docker image instead, install the
  // "Docker Pipeline" Jenkins plugin and replace this with:
  //   agent { docker { image 'mcr.microsoft.com/playwright:v1.56.0-noble' args '--user root' } }
  agent any

  options {
    // Timestamps in console output
    timestamps()
  }

  environment {
    NODE_ENV = 'test'
    // Allure Docker Service URL inside the docker network
    ALLURE_DOCKER_URL = 'http://allure-docker-service:5050'
    // Allure Docker Service project ID
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
          # Install Node.js 20 if not present
          if ! command -v node >/dev/null 2>&1; then
            echo "Installing Node.js 20..."
            apt-get update -qq
            apt-get install -y -qq curl
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y -qq nodejs
          fi

          # Install zip if not present (needed for Allure upload)
          if ! command -v zip >/dev/null 2>&1; then
            apt-get update -qq && apt-get install -y -qq zip
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
          // Lint failures mark the build as UNSTABLE but do not stop the pipeline
          catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh 'npm run lint'
          }
        }
      }
    }

    stage('Clean reports') {
      steps {
        sh '''
          rm -rf allure-results allure-report playwright-report logs || true
          mkdir -p logs
        '''
      }
    }

    stage('Test') {
      steps {
        script {
          // Test failures mark the build as UNSTABLE but subsequent stages still run
          catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh 'npx playwright test 2>&1 | tee logs/playwright-output.log; exit ${PIPESTATUS[0]}'
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
      script {
        // Playwright HTML report
        archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true

        // Allure raw results
        archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true

        // Text logs (playwright-output.log + test-run.log)
        archiveArtifacts artifacts: 'logs/**', allowEmptyArchive: true

        // Allure report via Jenkins plugin
        allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
      }
    }
  }
}
