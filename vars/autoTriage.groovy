import com.sonyericsson.jenkins.plugins.bfa.PluginImpl
import hudson.model.User
import hudson.tasks.junit.TestResultAction
import hudson.plugins.claim.ClaimTestAction
import java.util.regex.Pattern

// Trusted global pipeline library step.
//
// Auto-triage: claim each failed test whose error text matches a BFA known-error
// signature, so the native Claim column separates known failures (a bfa-auto
// claim) from new ones (unclaimed). Matching is by error text, not test name.
// Requires global Claim sticky = OFF so claims recompute each build.
//
// Runs OUTSIDE the Groovy sandbox (global libraries are trusted), so the
// internal Jenkins API calls below need no in-process script approval.
//
// Usage from a Jenkinsfile (after the `junit` step): autoTriage(currentBuild)

def call(currentBuild) {
  // currentBuild is a RunWrapper; unwrap to the Run here, in trusted code,
  // so the sandboxed Jenkinsfile never has to call getRawBuild() itself.
  def result = triage(currentBuild.getRawBuild())
  echo "Auto-triage: ${result.matched} known / ${result.unclaimed} to investigate"
  return result
}

@NonCPS
def triage(build) {
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
