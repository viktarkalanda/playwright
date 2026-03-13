pipeline {
  // Runs on the Jenkins controller.
  // To use the official Playwright Docker image instead, install the
  // "Docker Pipeline" Jenkins plugin and replace this with:
  //   agent { docker { image 'mcr.microsoft.com/playwright:v1.56.0-noble' args '--user root' } }
  agent any

  options {
    timestamps()
  }

  parameters {
    // Level 1: folder selection
    activeChoice(
      name: 'FOLDER',
      description: 'Select a test folder, or leave as (all) to show all spec files',
      choiceType: 'PT_SINGLE_SELECT',
      script: [
        $class: 'GroovyScript',
        script: [
          script: '''
            def base = new File(WORKSPACE + '/tests')
            if (!base.exists()) return ['(all)']
            def dirs = ['(all)']
            base.eachDirRecurse { d ->
              if (d.listFiles({ f -> f.name.endsWith('.spec.ts') } as FileFilter)) {
                dirs << d.path.replace(WORKSPACE + '/', '')
              }
            }
            return dirs.sort()
          '''
        ]
      ]
    )

    // Level 2: spec files — reactive to FOLDER
    reactiveChoice(
      name: 'SPECS',
      description: 'Spec files to run — all are checked by default, uncheck to exclude',
      choiceType: 'PT_CHECKBOX',
      referencedParameters: 'FOLDER',
      script: [
        $class: 'GroovyScript',
        script: [
          script: '''
            def base = new File(WORKSPACE + '/tests')
            if (!base.exists()) return []
            def files = []
            base.eachFileRecurse { f ->
              if (f.name.endsWith('.spec.ts')) {
                def rel = f.path.replace(WORKSPACE + '/', '')
                if (FOLDER == '(all)' || f.path.startsWith(WORKSPACE + '/' + FOLDER)) {
                  files << rel
                }
              }
            }
            return files.sort()
          '''
        ]
      ]
    )

    // Level 3: individual tests — reactive to SPECS
    reactiveChoice(
      name: 'TESTS',
      description: 'Individual tests to run — all checked means run all tests in selected specs',
      choiceType: 'PT_CHECKBOX',
      referencedParameters: 'SPECS',
      script: [
        $class: 'GroovyScript',
        script: [
          script: '''
            if (!SPECS || SPECS.trim().isEmpty()) return ['(select specs above)']
            def specList = SPECS.split(',').collect { it.trim() }.findAll { it }
            def result = []
            specList.each { spec ->
              def proc = ['bash', '-c', "cd ${WORKSPACE} && npx playwright test ${spec} --list 2>/dev/null"].execute()
              proc.text.readLines().each { line ->
                def m = line =~ /›\s+.+?\s+›\s+(.+)/
                if (m) result << "${spec} :: ${m[0][1].trim()}"
              }
            }
            return result ?: ['(no tests found)']
          '''
        ]
      ]
    )
  }

  environment {
    NODE_ENV = 'test'
    ALLURE_DOCKER_URL = 'http://allure-docker-service:5050'
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
          def cmd

          def hasTests = params.TESTS &&
            params.TESTS != '(select specs above)' &&
            params.TESTS != '(no tests found)'

          def hasSpecs = params.SPECS && params.SPECS.trim()

          if (hasTests) {
            // Build grep pattern and spec list from selected individual tests
            def entries   = params.TESTS.split(',').collect { it.trim() }.findAll { it }
            def specFiles = entries.collect { it.replaceAll(/\s*::.*/, '') }.unique().join(' ')
            def testNames = entries.collect { it.replaceAll(/.*::\s*/, '').replace('(', '\\(').replace(')', '\\)') }
            def grep      = testNames.join('|')
            cmd = "npx playwright test ${specFiles} --grep \"${grep}\""
          } else if (hasSpecs) {
            // Run only the selected spec files
            def specFiles = params.SPECS.split(',').collect { it.trim() }.findAll { it }.join(' ')
            cmd = "npx playwright test ${specFiles}"
          } else {
            // No parameters selected — run everything
            cmd = 'npx playwright test'
          }

          catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
            sh "${cmd} 2>&1 | tee logs/playwright-output.log; exit \${PIPESTATUS[0]}"
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
        archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        archiveArtifacts artifacts: 'allure-results/**', allowEmptyArchive: true
        archiveArtifacts artifacts: 'logs/**', allowEmptyArchive: true
        allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
      }
    }
  }
}
