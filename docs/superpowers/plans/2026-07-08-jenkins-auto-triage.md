# Jenkins Auto-Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-claim failed Jenkins tests that match a BFA known-error signature, so the native Claim column becomes a "known vs new" triage view keyed on error text.

**Architecture:** Playwright emits a JUnit XML; Jenkins publishes it as a Test Result with the Claim data publisher enabled; a controller-side Groovy stage runs after `junit`, reads the BFA cause catalog, matches each failed test's error text against the cause regexes, and sets/refreshes a `bfa-auto` claim on matches while leaving human claims untouched. BFA remains the UI-editable catalog; Allure `categories.json` and BFA build-level summary are untouched.

**Tech Stack:** Playwright (`@playwright/test`), Jenkins declarative pipeline (Groovy), Build Failure Analyzer plugin, Claim plugin, JUnit plugin.

## Global Constraints

- All code, comments, identifiers in **English** only. No Russian.
- **Never auto-commit.** Commit steps below are commands for the **user** to run after review — the implementer stages changes and proposes the commit, the user executes it.
- Claim **sticky = OFF** (Jenkins global Claim config) — required so auto-claims recompute each build.
- The auto-triage Groovy stage runs strictly **after** the `junit` step, in the same build.
- Bot claimant identity is the literal string `bfa-auto`.
- Verification for Jenkins-internal behavior happens in the **Jenkins Script Console** and on **real build runs**, not local unit tests.

---

## File Structure

- `playwright.config.ts` — add a `junit` reporter output (modify).
- `Jenkinsfile` — add `junit` publish + `Auto-triage` stage (modify).
- `docs/jenkins/auto-triage-fallback.md` — document the JUnit-XML-rewrite fallback (create, only if Task 0 fails).

---

### Task 0: Verify load-bearing assumptions in Jenkins Script Console (GATE)

No repo changes. This task decides whether the primary (auto-claim) path is viable or we switch to the fallback. Run each snippet at `<jenkins>/script` (Manage Jenkins → Script Console). Record the exact output/signatures — Task 3 depends on them.

**Interfaces:**
- Produces (findings consumed by Task 3): the exact method to list BFA causes and their regex patterns; the exact `ClaimTestAction` method/constructor to set a claim; whether in-process script approval is required.

- [ ] **Step 1: Confirm BFA causes + regex are readable**

Run in Script Console:

```groovy
import com.sonyericsson.jenkins.plugins.bfa.PluginImpl
def kb = PluginImpl.getInstance().getKnowledgeBase()
def causes = kb.getCauses()
println "cause count: ${causes.size()}"
causes.each { c ->
  println "cause: ${c.getName()} / ${c.getDescription()}"
  c.getIndications().each { ind ->
    println "  indication class: ${ind.getClass().getName()}"
    println "  pattern: ${ind.getPattern()}"   // java.util.regex.Pattern expected
  }
}
```

Expected: prints your 5 causes, each with at least one indication and a non-null `pattern`.
If `getPattern()` does not exist on an indication type, note the actual accessor (e.g. `getSearchString()`) — Task 3 uses whatever is found here.

- [ ] **Step 2: Confirm a failed test can be claimed programmatically and persists**

Pick a recent build number `N` of this job that has at least one failed test. Run:

```groovy
import hudson.tasks.junit.TestResultAction
import hudson.plugins.claim.ClaimTestAction
def job = Jenkins.instance.getItemByFullName('<JOB_FULL_NAME>')
def build = job.getBuildByNumber(N)
def tra = build.getAction(TestResultAction.class)
def failed = tra.getFailedTests()
println "failed tests: ${failed.size()}"
def cr = failed[0]
def claim = cr.getTestAction(ClaimTestAction.class)
println "ClaimTestAction present: ${claim != null}"
if (claim != null) {
  // Discover the exact claim setter signature for this Claim plugin version:
  claim.getClass().getMethods().findAll { it.name == 'claim' }.each { println it }
}
```

Expected: `ClaimTestAction present: true` and at least one `claim(...)` method printed.
If `ClaimTestAction present: false`, the Claim data publisher was not attached to this build — that is fixed in Task 2; re-verify against a build produced after Task 2.
**Record the exact `claim(...)` signature** — Task 3 calls it.

- [ ] **Step 3: Actually set a claim, save, and confirm it sticks**

Using the signature found in Step 2 (this example matches common Claim plugin versions — adjust to what Step 2 printed):

```groovy
// signature seen in many versions: claim(String reason, String claimedBy, String providerId, boolean sticky, boolean propagateToFollowingBuilds)
claim.claim("[BFA] smoke-test verify", "bfa-auto", null, false, false)
build.save()
println "claimed by: ${claim.getClaimedBy()} reason: ${claim.getReason()}"
```

Expected: prints `claimed by: bfa-auto`. Reload the build page in Jenkins UI — the test shows the claim. Then unclaim it manually to clean up.

- [ ] **Step 4: Record the script-approval situation**

Note whether Steps 1-3 ran without a `RejectedAccessException`. In the actual pipeline, these APIs run in a `script {}` block; if signature approval is required, the resolution is either approving each signature at Manage Jenkins → In-process Script Approval, or moving the bridge into a Global Trusted Pipeline Library. Write down which path you'll use in Task 3.

- [ ] **Step 5: Gate decision**

If Steps 1-3 all succeeded → proceed with Tasks 1-4 (primary path).
If Step 1 or Step 3 could not be made to work → skip Task 3's claim logic and implement the **Fallback** appendix instead (JUnit-XML rewrite). Record the decision in the task tracker.

---

### Task 1: Emit a JUnit XML from Playwright

**Files:**
- Modify: `playwright.config.ts:30-35` (the `reporter` array)

**Interfaces:**
- Produces: a JUnit report at `test-results/junit.xml` for the `junit` step in Task 2 to consume.

- [ ] **Step 1: Add the junit reporter**

Change the `reporter` array so it always includes a JUnit output. Replace lines 30-35:

```typescript
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(process.env.CI ? [] : [['html', { open: 'never' }] as const]),
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./src/reporters/TextFileReporter.ts', { outputFile: process.env.LOG_FILE ?? 'logs/test-run.log' }],
  ],
```

- [ ] **Step 2: Run a subset and confirm the XML is produced with failure text**

Run:

```bash
npx playwright test --project=chromium tests/ui/second-shop/home-page.spec.ts
```

Expected: after the run, `test-results/junit.xml` exists. Open it and confirm each `<testcase>` for a failed test contains a `<failure>` element whose message/body carries the Playwright error text (this text is what Task 3 matches against). If all tests pass, temporarily break one assertion to confirm the `<failure>` content, then revert.

- [ ] **Step 3: Stage and propose commit (user runs it)**

```bash
git add playwright.config.ts
git commit -m "test: emit JUnit XML report for Jenkins triage"
```

---

### Task 2: Publish the Test Result with the Claim data publisher

**Files:**
- Modify: `Jenkinsfile:120-135` (the `post { always { ... } }` block)

**Interfaces:**
- Consumes: `test-results/junit.xml` from Task 1.
- Produces: a `TestResultAction` on the build, with a `ClaimTestAction` attached to each test case (required by Task 3).

- [ ] **Step 1: Add the junit step with the Claim data publisher**

Inside `post { always { script { ... } } }`, before the `allure(...)` line, add:

```groovy
        // Publish JUnit Test Result; attach Claim actions to every test case
        // so failed tests can be claimed (manually or by the auto-triage stage).
        junit testResults: 'test-results/junit.xml',
              allowEmptyResults: true,
              testDataPublishers: [[$class: 'ClaimTestDataPublisher']]
```

- [ ] **Step 2: Archive the junit xml too (optional but useful)**

Add alongside the other `archiveArtifacts` lines:

```groovy
        archiveArtifacts artifacts: 'test-results/junit.xml', allowEmptyArchive: true
```

- [ ] **Step 3: Run a build and verify**

Trigger a build on branch `feature/jenkins-claim-bfa`. Expected on the build page:
- "Test Result" link appears with the failed tests listed.
- Opening a failed test shows a **Claim** control (proves `ClaimTestDataPublisher` attached the action).

Re-run Task 0 Step 2 against this new build number to confirm `ClaimTestAction present: true`.

- [ ] **Step 4: Stage and propose commit (user runs it)**

```bash
git add Jenkinsfile
git commit -m "ci: publish JUnit Test Result with Claim data publisher"
```

---

### Task 3: Auto-triage Groovy bridge (BFA match → bfa-auto claim)

**Files:**
- Modify: `Jenkinsfile` — add a new `stage('Auto-triage')` after the `Test` stage's results are published. Because claiming needs the `TestResultAction`, run this in `post { always { ... } }` **after** the `junit` step from Task 2 (same `script` block, immediately following `junit`).

**Interfaces:**
- Consumes: BFA causes accessor + `ClaimTestAction` claim signature discovered in Task 0; the `TestResultAction` produced in Task 2.
- Produces: `bfa-auto` claims on matched failed tests; human claims left intact.

- [ ] **Step 1: Add the bridge after the junit step**

Place this immediately after the `junit ...` call in `post { always { script { ... } } }`. Adjust the two Task-0-dependent spots as marked:

```groovy
        // --- Auto-triage: claim failed tests that match a BFA known-error signature ---
        // Runs after junit so the TestResultAction exists. Human claims are preserved;
        // only bfa-auto claims are (re)computed each build. Requires sticky claim = OFF.
        try {
          def result = autoTriage(currentBuild.rawBuild)
          echo "Auto-triage: ${result.matched} known / ${result.unclaimed} to investigate"
        } catch (err) {
          // Never fail the build because triage had a problem — just report it.
          echo "Auto-triage skipped: ${err}"
        }
```

- [ ] **Step 2: Add the `autoTriage` method at the top of the Jenkinsfile (before `pipeline {`)**

The accessor names below match the common plugin versions; **replace `ind.getPattern()` and the `claim.claim(...)` call with exactly what Task 0 Steps 1 and 2 found** if they differ.

```groovy
import com.sonyericsson.jenkins.plugins.bfa.PluginImpl
import hudson.tasks.junit.TestResultAction
import hudson.plugins.claim.ClaimTestAction
import java.util.regex.Pattern

// Returns a map: [matched: int, unclaimed: int]
@NonCPS
def autoTriage(build) {
  def tra = build.getAction(TestResultAction.class)
  if (tra == null) { return [matched: 0, unclaimed: 0] }

  def causes = PluginImpl.getInstance().getKnowledgeBase().getCauses()
  int matched = 0
  int unclaimed = 0

  for (cr in tra.getFailedTests()) {
    def text = ((cr.getErrorDetails() ?: '') + '\n' + (cr.getErrorStackTrace() ?: ''))
    def claim = cr.getTestAction(ClaimTestAction.class)
    if (claim == null) { continue }

    // Preserve human claims: only touch unclaimed tests or ones we claimed ourselves.
    boolean isBotClaim = claim.isClaimed() && claim.getClaimedBy() == 'bfa-auto'
    if (claim.isClaimed() && !isBotClaim) { continue }

    def hit = findCause(causes, text)

    if (hit != null) {
      // (Re)claim as bfa-auto. Signature per Task 0 Step 2.
      claim.claim("[BFA] ${hit.getName()}: ${hit.getDescription()}", 'bfa-auto', null, false, false)
      matched++
    } else if (isBotClaim) {
      // Error no longer matches the catalog: drop our stale auto-claim.
      claim.unclaim()
      unclaimed++
    } else {
      unclaimed++
    }
  }
  build.save()
  return [matched: matched, unclaimed: unclaimed]
}

// Returns the first FailureCause whose any indication pattern matches text, or null.
@NonCPS
def findCause(causes, String text) {
  for (c in causes) {
    for (ind in c.getIndications()) {
      Pattern p = ind.getPattern()   // <-- adjust accessor per Task 0 Step 1 if needed
      if (p != null && p.matcher(text).find()) { return c }
    }
  }
  return null
}
```

- [ ] **Step 3: Handle script approval (if Task 0 Step 4 flagged it)**

If the build console shows `RejectedAccessException` / "Scripts not permitted to use method ...":
- Go to Manage Jenkins → In-process Script Approval and approve each listed signature, **or**
- Move `autoTriage`/`findCause` into a Global Trusted Pipeline Library (`vars/autoTriage.groovy`) configured under Manage Jenkins → System → Global Pipeline Libraries, and call `autoTriage(currentBuild.rawBuild)` from the Jenkinsfile.

Re-run the build until it completes with no rejection.

- [ ] **Step 4: Verify on a real build with a known error**

Ensure at least one BFA cause's regex matches an error present in the current failures (add a temporary cause in the BFA UI whose regex matches one failing test's message if needed). Trigger a build. Expected:
- Console prints `Auto-triage: <n> known / <m> to investigate` with `n >= 1`.
- On the Test Result page, the matched failed test shows a claim by `bfa-auto` with reason `[BFA] <cause name>: <description>`.
- A failing test whose error matches no cause shows **no** claim.

- [ ] **Step 5: Verify the overwrite + drop rules**

- Manually claim one matched test as yourself, re-run the build → the manual claim survives (bot did not overwrite it).
- Remove/point a BFA cause away so a previously `bfa-auto`-claimed test no longer matches, re-run → that test's `bfa-auto` claim is dropped (test returns to "to investigate").

- [ ] **Step 6: Stage and propose commit (user runs it)**

```bash
git add Jenkinsfile
git commit -m "ci: auto-claim failed tests matching BFA known-error signatures"
```

---

### Task 4: End-to-end triage dry run + short usage note

**Files:**
- Create: `docs/jenkins/auto-triage-usage.md`

**Interfaces:**
- Consumes: the working pipeline from Tasks 1-3.

- [ ] **Step 1: Full end-to-end pass**

Trigger a clean build with a mix of known and new failures. Confirm the "All Failed Tests" view splits cleanly: `bfa-auto`-claimed = known (skip), unclaimed = investigate.

- [ ] **Step 2: Write the usage note**

```markdown
# Auto-Triage: known vs new failures

When a Jenkins build fails, open **Test Result → All Failed Tests**:

- **Claimed by `bfa-auto`** (reason `[BFA] <cause>`) = known failure → skip.
- **Unclaimed** = new failure → investigate.

To make a new error auto-recognized next run:
1. Investigate the failure and copy a stable, unique fragment of its error text.
2. Manage Jenkins → BFA "Failure Cause Management" → add a cause with a regex
   indication matching that fragment.
3. Next build auto-claims that error as `bfa-auto`.

Notes:
- Matching is by **error text**, not test name — a test failing for a new reason
  will NOT carry an old claim.
- Manual claims are never overwritten by the bot.
- Requires global Claim **sticky = OFF**.
```

- [ ] **Step 3: Stage and propose commit (user runs it)**

```bash
git add docs/jenkins/auto-triage-usage.md
git commit -m "docs: add auto-triage usage note"
```

---

## Fallback appendix — JUnit-XML rewrite (only if Task 0 gate fails)

If BFA causes are not readable from Groovy (Task 0 Step 1) or claims cannot be set programmatically (Task 0 Step 3), keep Tasks 1-2 and replace Task 3 with a text-based bridge:

1. In a `sh`/Node step after the Playwright run (agent side, no Jenkins internals), read `test-results/junit.xml` and a repo-local catalog of regexes (a JSON file, seeded from your BFA rules).
2. For each `<testcase>` with a `<failure>` whose text matches a catalog regex, prepend `[KNOWN ▸ <cause>] ` to the testcase `name` (or into the failure message).
3. Let the Task 2 `junit` step publish the rewritten XML. In "All Failed Tests", known failures are visibly prefixed; unprefixed = new.

Trade-off vs primary path: the catalog lives in a repo JSON (edited + committed) rather than the BFA UI, and marks appear in the test name rather than the Claim column. Same per-test known/new outcome.

---

## Self-Review

- **Spec coverage:** BFA-as-UI-catalog (Tasks 0/3, BFA untouched) ✓; minimal Groovy bridge (Task 3) ✓; per-test visibility via native Jenkins (Claim column, Task 3) ✓; stale-claim fix via per-build recompute + sticky OFF (Task 3 Step 5, Global Constraints) ✓; human-claim preservation / bot-overwrites-own (Task 3 Step 2 logic + Step 5) ✓; JUnit reporter gap closed (Tasks 1-2) ✓; Allure categories + BFA build-level untouched (not modified anywhere) ✓; risks A/B/C verified first (Task 0 gate) ✓; fallback documented (appendix) ✓.
- **Placeholder scan:** No TBD/TODO; the two Task-0-dependent accessors (`getPattern()`, `claim(...)` signature) are explicitly flagged with the discovery step that resolves them, not left vague.
- **Type consistency:** `autoTriage(build)` returns `[matched, unclaimed]` and is called consistently in Task 3 Step 1; `findCause(causes, text)` returns a `FailureCause` used via `getName()/getDescription()`; claimant string `bfa-auto` identical across Tasks 0, 3, 4.
```
