pipeline {
  // Run on the Jenkins controller (our jenkins container)
  agent any

  options {
    // Add timestamps to console output
    timestamps()
  }

  environment {
    NODE_ENV = 'test'
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

          node -v
          npm -v

          npm ci
          npx playwright install --with-deps
        '''
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Test') {
      steps {
        sh 'npx playwright test'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'allure-results/**', fingerprint: true, allowEmptyArchive: true
    }
  }
}
