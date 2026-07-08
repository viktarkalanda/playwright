import com.sonyericsson.jenkins.plugins.bfa.PluginImpl
import hudson.model.User
import hudson.tasks.junit.TestResultAction
import hudson.plugins.claim.ClaimTestAction
import java.util.regex.Pattern

// Auto-triage: claim each failed test whose error text matches a BFA known-error
// signature, so the native Claim column separates known failures (a bfa-auto
// claim) from new ones (unclaimed). Matching is by error text, not test name.
// Requires global Claim sticky = OFF so claims recompute each build.
// Returns [matched: int, unclaimed: int].
@NonCPS
def autoTriage(build) {
  def tra = build.getAction(TestResultAction.class)
  if (tra == null) { return [matched: 0, unclaimed: 0] }

  def causes = PluginImpl.getInstance().getKnowledgeBase().getCauses()
  def bot = User.getById('bfa-auto', true)
  int matched = 0
  int unclaimed = 0

  for (cr in tra.getFailedTests()) {
    def claim = cr.getTestAction(ClaimTestAction.class)
    if (claim == null) { continue }

    // Preserve human claims: only (re)compute the claims we own.
    boolean botClaim = claim.isClaimed() && claim.getClaimedBy() == 'bfa-auto'
    if (claim.isClaimed() && !botClaim) { continue }

    def text = (cr.getErrorDetails() ?: '') + '\n' + (cr.getErrorStackTrace() ?: '')
    def hit = findCause(causes, text)

    if (hit != null) {
      // Signature: claim(claimedBy, reason, assignedBy, date, sticky, propagated, selfAssigned)
      claim.claim(bot, '[BFA] ' + hit.getName() + ': ' + hit.getDescription(),
                  bot, new Date(), false, false, true)
      matched++
    } else if (botClaim) {
      // Error no longer matches the catalog: drop our stale auto-claim.
      claim.unclaim(false)
      unclaimed++
    } else {
      unclaimed++
    }
  }
  build.save()
  return [matched: matched, unclaimed: unclaimed]
}

// First FailureCause whose any indication pattern is found in text, else null.
@NonCPS
def findCause(causes, String text) {
  for (c in causes) {
    for (ind in c.getIndications()) {
      Pattern p = ind.getPattern()
      if (p != null && p.matcher(text).find()) { return c }
    }
  }
  return null
}

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

        archiveArtifacts artifacts: 'test-results/junit.xml', allowEmptyArchive: true

        // Publish JUnit Test Result; attach Claim actions to every test case
        // so failed tests can be claimed (manually or by the auto-triage stage).
        junit testResults: 'test-results/junit.xml',
              allowEmptyResults: true,
              testDataPublishers: [[$class: 'ClaimTestDataPublisher']]

        // Auto-triage: (re)claim failed tests matching a BFA known-error
        // signature. Runs after junit so the TestResultAction exists.
        // Never fails the build if triage itself has a problem.
        try {
          def triage = autoTriage(currentBuild.rawBuild)
          echo "Auto-triage: ${triage.matched} known / ${triage.unclaimed} to investigate"
        } catch (err) {
          echo "Auto-triage skipped: ${err}"
        }

        // Allure report via Jenkins plugin
        allure results: [[path: 'allure-results']], reportBuildPolicy: 'ALWAYS'
      }
    }
  }
}
