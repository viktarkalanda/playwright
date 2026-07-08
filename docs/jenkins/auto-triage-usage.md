# Auto-Triage: known vs new failures

When a Jenkins build fails, open **Test Result → All Failed Tests**:

- **Claimed by `bfa-auto`** (reason `[BFA] <cause>: <description>`) = known failure → skip.
- **Unclaimed** = new failure → investigate.

The build console also prints a one-line summary:
`Auto-triage: <n> known / <m> to investigate`.

## Quick demo (showcase scope)

10 tests (3 pass, 7 fail) with intentional error signatures — no browser.

**Jenkins:** Build with parameter `TEST_SCOPE = showcase`.

**Locally:**

```bash
npm run test:jenkins-showcase
# or by tag:
npm run test:jenkins-showcase:grep
```

File: `tests/jenkins/bfa-showcase.spec.ts` (tag `@jenkins-showcase`).

## Make a new error auto-recognized next run

1. Investigate the failure and copy a stable, unique fragment of its error text.
2. Manage Jenkins → BFA **Failure Cause Management** → add a cause with a
   regex indication matching that fragment.
3. The next build auto-claims that error as `bfa-auto`.

## How it works

A Groovy step in the `Jenkinsfile` (`autoTriage`) runs right after the `junit`
step. For each failed test it matches the test's error text against every BFA
cause's regex and, on the first match, claims the test as `bfa-auto` with the
cause name/description as the reason.

## Rules and caveats

- **Matching is by error text, not test name** — a test failing for a new
  reason will NOT carry an old claim.
- **Human claims are never overwritten.** The bridge only (re)computes claims
  whose claimant is `bfa-auto`; a claim you set by hand is left untouched.
- **Stale auto-claims are dropped.** On a re-run, a test previously claimed by
  `bfa-auto` whose error no longer matches any cause is unclaimed and returns to
  the "to investigate" bucket.
- **Requires global Claim `sticky = OFF`** so claims recompute each build.
- **The known/new split is only as good as your BFA regexes.** Broad patterns
  (e.g. `.*Timeout .* exceeded.*`) will claim many tests as the same cause and
  can mask genuinely new problems that happen to share that surface. Prefer
  specific fragments over generic ones.
- **First match wins.** If a test's error matches several causes, the first cause
  in BFA's list is used.

## Not covered here

- Allure `categories.json` classification (independent layer, unchanged).
- BFA build-level "Identified problems" on the build page (unchanged, informational).
