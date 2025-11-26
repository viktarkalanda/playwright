pipeline {
  agent {
    docker {
      // Node.js 20 LTS in a Linux container
      image 'node:20-bullseye'
      // Run as root to avoid permission issues with npm caches, playwright installs, etc.
      args '-u root:root'
    }
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    NODE_ENV = 'test'
  }

  stages {
    stage('Checkout') {
      steps {
        // Checkout repository from the SCM configured in the Jenkins job
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm ci'
        // Install Playwright browsers and system dependencies inside the container
        sh 'npx playwright install --with-deps'
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
      // Archive Playwright HTML report
      archiveArtifacts artifacts: 'playwright-report/**', fingerprint: true, allowEmptyArchive: true
      // Archive Allure raw results (can be processed later)
      archiveArtifacts artifacts: 'allure-results/**', fingerprint: true, allowEmptyArchive: true
    }
  }
}
