# Jenkins Auto-Triage — Design

**Date:** 2026-07-08
**Branch:** feature/jenkins-claim-bfa
**Status:** Approved (design), pending implementation plan

## Problem

Regression analysis wastes time re-investigating failures that were already
understood in a previous run. We want a ReportPortal-style triage — "known vs
new" — but built **only** from Jenkins plugins already installed plus a minimal
custom script. No ReportPortal, no external SaaS.

Concretely, when a run fails the engineer wants to open the list of failed tests
and immediately see, per test, **what failed and why** when the cause is already
known — and have everything unmarked stand out as "new, investigate."

### Why the existing tools don't solve it alone

- **Test Results Analyzer** shows only that a test failed before; it does not
  link a failure to a known cause and does not match by error signature.
- **Claim** is attached to a test, not to an error signature. If the same test
  fails next time for a **different** reason, the old claim is still shown —
  a misleading "stale claim."
- **BFA "Identified problems"** is build-level: it says a known error occurred
  in this run, but not **which test** carries it, so the per-test mapping is lost.

## Goal

One manual triage pass. Mark an error's signature once. On the next run the same
error is auto-flagged as known and skipped; anything that matches no known
signature stands out as new.

Matching must be by **error signature (text)**, not by test name — this is what
removes the stale-claim problem.

## Approach (chosen)

**BFA is the UI-editable catalog of known error signatures. A minimal
controller-side Groovy step bridges BFA matches into per-test Claims.**

Auto-claiming failed tests that match the BFA catalog turns the native Jenkins
**Claim column** into the triage view:

- **Claimed (by `bfa-auto`) = known** → skip.
- **Unclaimed = new** → investigate.

The claim `reason` carries the "why" (`[BFA] <cause name>: <description>`), so we
do **not** need to rewrite JUnit XML in the primary path.

### Why auto-claim also fixes stale claims

Auto-claims are recomputed **every build from the current run's actual error**
(sticky claim = OFF). If a test now fails for a new error not in the catalog, it
stays unclaimed → surfaces as new. The old claim does not stick.

## Architecture & flow

```
Playwright test ──▶ JUnit-XML + Playwright JSON + Allure results
                         │
   stage: junit  ────────┤  publishes Test Result (required by Claim / TRA)
                         │
   stage: auto-triage ───┘  (Groovy on controller, AFTER junit)
        1. read BFA causes + regex from KnowledgeBase
        2. get failed tests + their error text from TestResultAction
        3. match each test's error against the cause regexes
        4. match  → ClaimTestAction(by='bfa-auto', reason='[BFA] <cause>')
           no match → leave unclaimed
        5. never touch human claims (claimant != 'bfa-auto')
```

Independent, parallel layers left untouched:

- **Allure `categories.json`** — stays as its own per-test classification layer
  inside Allure.
- **BFA build-level** "Identified problems" — stays on the build page as a bonus
  summary.

## Components / changes

| Area | Change |
|---|---|
| Playwright | Add a JUnit reporter in `playwright.config` so a JUnit XML is produced. |
| Jenkinsfile | Add a `junit` step (publish Test Result) + an `auto-triage` Groovy step **after** it. |
| BFA | Remains the source of truth for signatures; rules are managed in the UI as today. |
| Claim | Sticky = **OFF** (already the case); a bot claimant `bfa-auto` is introduced. |
| Bridge script | Minimal Groovy in the `Jenkinsfile`, or in a trusted shared library if script approval requires it. |

## Conflict rule (human vs auto claim)

Distinguish claims by author:

- **Bot claims** (`claimant == 'bfa-auto'`) are always re-evaluated and
  overwritten each run/re-analysis to reflect the current error — including being
  **removed** if the error is no longer in the catalog.
- **Human claims** (`claimant != 'bfa-auto'`) are never touched.

In practice the conflict rarely arises: the build is fresh (sticky OFF) and the
script runs right after `junit`, before the engineer opens the tests. The rule
only matters on re-runs / re-analysis, where it behaves predictably.

## User workflow

1. A run fails. Open **All Failed Tests** in Jenkins.
2. Tests with a `bfa-auto` claim + reason = **known → skip**.
3. Tests without a claim = **new → investigate**.
4. After understanding a new error, add a regex rule in the **BFA UI**.
5. Next run auto-claims that error. No more time spent on it.

## Preconditions

- Claim **sticky = OFF**.
- The `auto-triage` Groovy step runs strictly **after** `junit`, in the same build.

## Risks & first things to verify

- **A.** `KnowledgeBase.getCauses()` and each cause's regex are readable from
  pipeline Groovy.
- **B.** `ClaimTestAction` can be set programmatically and survives a reload.
- **C.** In-process **script approval** is likely required for the internal
  Jenkins APIs (or move the bridge into a Global Trusted shared library).

**Fallback** if A or B fail: the bridge rewrites the JUnit XML instead, embedding
a `[KNOWN ▸ <cause>]` marker into the failing test's name/error text. Same
per-test result, different carrier (no Claim).

## Out of scope

- ReportPortal or any external SaaS.
- Changing Allure `categories.json` (kept independent).
- Flaky-retry detection (separate concern).
```
