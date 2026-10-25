# CareerPilot E2E Test Suite Infrastructure & Architecture Specification

**Document Version:** 1.0.0  
**Status:** Approved & Implemented  
**Integrity Mode:** Strict Contract-Driven E2E (Development & Release Ready)  
**Target Environment:** Python 3.12 - 3.14 / Standard Library + ReportLab / Node.js 20+

---

## 1. Test Philosophy & Methodology

The CareerPilot Modernization E2E Test Suite guarantees product correctness, anti-hallucination truth guards, anti-spam discovery, and state machine integrity through formal, rigorous testing methodologies. Tests are derived strictly from user requirements in `ORIGINAL_REQUEST.md` and public contracts in `PROJECT.md § Interface Contracts`.

### 1.1 Category-Partition Method (Ostrand & Balcer)
Every interface input domain is partitioned into mutually exclusive equivalence classes:
- **Job Discovery Query & Text**: Valid role titles, location qualifiers, negative filter tokens, misleading employer history strings ("founded 10 years ago"), junior experience expressions (`0-1`, `0-2`, `0-3` years), senior experience triggers (`>2` years), and spam keywords (`bootcamp`, `training program`, `curriculum`).
- **Matching Engine Bullets**: Formatted single-line requirements, unformatted multiline blocks under section headers (`Requirements:`, `Must-Have:`, `Qualifications:`), mixed whitespace bullets, tab-indented bullets, dash/asterisk/bullet glyph markers, and empty lines.
- **Application State Transitions**: Directed graph states (`Saved`, `Preparing`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected`, `Withdrawn`), valid direct paths (`Saved -> Applied`), reopening edges (`Rejected -> Saved|Preparing|Applied`), and illegal backwards/disallowed transitions.
- **Outreach & Text Generators**: Output length boundaries (LinkedIn note strictly `< 300` characters, count `<= 299`), cold email subject line formats, and evidence grounding against candidate profile.

### 1.2 Boundary Value Analysis (BVA)
Extensive boundary testing is executed at the critical transitions of system parameters:
- **Character Count Boundaries**: LinkedIn connection notes at 0 chars, 1 char, 298 chars, 299 chars (maximum allowable), and 300+ chars (hard rejection).
- **Experience Years**: 0 years (fresher), 1 year (entry), 2 years (threshold entry), 3 years (maximum fresher window for university grads), and 4+ years (disqualified senior).
- **Candidate Skill Matching Fit Score**: Empty match (`fit_score = 0`), partial match (`0 < fit_score < 100`), perfect match (`fit_score = 100`).
- **Platform Connector Metrics**: 0 solved problems, 0 repos, 0 stars, negative input handling, extreme values (`10,000+` solved, top 0.01% rank).

### 1.3 Pairwise / Combinatorial Testing (AETG)
Cross-feature interactions are validated using pairwise orthogonal arrays to discover emergent defects when multiple independent modules interoperate:
- Discovery × Matching Engine × State Machine
- Connectors (LeetCode/GitHub/LinkedIn) × Resume Tailoring × Outreach Generator
- TruthGuard Engine × Diff Review × ATS PDF Compilation
- Kanban Board State × Application Version Foreign Key × Reopening Workflows

### 1.4 Workload & Real-World User Workflows (Tier 4)
Workload scenarios model complete student lifecycles from initial discovery to career offer:
- Full student onboarding with disparate platform evidence.
- High-volume application tracking across 6 Kanban columns.
- Recovery from accidental application status changes.
- Adversarial defense against hallucinated metrics, unearned titles, and scraper traps.

---

## 2. Feature Inventory Mapping to Test Tiers

The 20 product features are mapped across the four hierarchical test tiers:

| # | Feature Name | Tier 1: Feature Coverage | Tier 2: Boundary & Corner | Tier 3: Cross-Feature | Tier 4: Real-World Workflow |
|---|--------------|--------------------------|---------------------------|-----------------------|-----------------------------|
| 1 | Dual Tavily API Key Support | T1.F01 (5 tests) | T2.F01 (5 tests) | T3.01, T3.15 | Scenario 5, Scenario 7 |
| 2 | Anti-Spam Query & Body Filter | T1.F02 (5 tests) | T2.F02 (5 tests) | T3.01, T3.11 | Scenario 5, Scenario 7 |
| 3 | Accurate Fresher Experience Filter | T1.F03 (5 tests) | T2.F03 (5 tests) | T3.01, T3.11 | Scenario 1, Scenario 5 |
| 4 | Persistent Saved Jobs Tab | T1.F04 (5 tests) | T2.F04 (5 tests) | T3.02, T3.15 | Scenario 1, Scenario 7 |
| 5 | Multiline Bullet Parser | T1.F05 (5 tests) | T2.F05 (5 tests) | T3.01, T3.16 | Scenario 1, Scenario 6 |
| 6 | Gap Categorization | T1.F06 (5 tests) | T2.F06 (5 tests) | T3.01, T3.16 | Scenario 1, Scenario 3 |
| 7 | Flexible Application State Machine | T1.F07 (5 tests) | T2.F07 (5 tests) | T3.06, T3.07, T3.17 | Scenario 4, Scenario 9 |
| 8 | Tailored Resume Version Linking | T1.F08 (5 tests) | T2.F08 (5 tests) | T3.05, T3.17 | Scenario 4, Scenario 7 |
| 9 | Gemini LangChain Structured Tailoring | T1.F09 (5 tests) | T2.F09 (5 tests) | T3.03, T3.13 | Scenario 2, Scenario 7 |
| 10 | Natural Language Instruction Handling | T1.F10 (5 tests) | T2.F10 (5 tests) | T3.18 | Scenario 2, Scenario 8 |
| 11 | Truth-Guarded Anti-Hallucination | T1.F11 (5 tests) | T2.F11 (5 tests) | T3.03, T3.12 | Scenario 8, Scenario 10 |
| 12 | Bullet-Level Diff Review | T1.F12 (5 tests) | T2.F12 (5 tests) | T3.12, T3.13 | Scenario 2, Scenario 8 |
| 13 | Professional ATS Single-Column PDF | T1.F13 (5 tests) | T2.F13 (5 tests) | T3.04, T3.13 | Scenario 6, Scenario 7 |
| 14 | LeetCode Platform Connector | T1.F14 (5 tests) | T2.F14 (5 tests) | T3.08, T3.14, T3.20 | Scenario 3, Scenario 10 |
| 15 | Public GitHub Connector | T1.F15 (5 tests) | T2.F15 (5 tests) | T3.09, T3.14, T3.20 | Scenario 2, Scenario 10 |
| 16 | LinkedIn Connector & PDF Parser | T1.F16 (5 tests) | T2.F16 (5 tests) | T3.10, T3.20 | Scenario 6, Scenario 10 |
| 17 | Platform Connectors Hub UI | T1.F17 (5 tests) | T2.F17 (5 tests) | T3.20 | Scenario 3, Scenario 10 |
| 18 | LinkedIn Outreach Generator | T1.F18 (5 tests) | T2.F18 (5 tests) | T3.14, T3.20 | Scenario 3, Scenario 7 |
| 19 | Cold Email Generator | T1.F19 (5 tests) | T2.F19 (5 tests) | T3.08, T3.16 | Scenario 1, Scenario 7 |
| 20 | Interactive Kanban Application Board | T1.F20 (5 tests) | T2.F20 (5 tests) | T3.06, T3.19 | Scenario 4, Scenario 9 |

- **Tier 1 (Feature Coverage):** 20 features × 5 test cases = **100 test cases**
- **Tier 2 (Boundary & Corner Cases):** 20 features × 5 test cases = **100 test cases**
- **Tier 3 (Cross-Feature Combinations):** 20 pairwise combination scenarios = **20 test cases**
- **Tier 4 (Real-World User Workflows):** 10 end-to-end multi-step scenarios = **10 test cases**
- **Total E2E Suite Volume:** **230 test cases**

---

## 3. Test Architecture & Directory Layout

### 3.1 Directory Layout
```
d:\projects\careerPilot\
├── TEST_INFRA.md                      # This infrastructure specification
├── TEST_READY.md                      # Test readiness certificate & runner guide
└── tests/
    ├── test_product_surface.py        # Baseline repository hygiene tests
    ├── run_e2e.py                     # Dedicated E2E Test Suite Runner
    └── e2e/
        ├── __init__.py
        ├── harness.py                 # Contracts, schema validators, mock engines, test fixtures
        ├── test_tier1_feature_coverage.py   # 100 tests (Features 1-20 primary behavior)
        ├── test_tier2_boundary_corner.py    # 100 tests (Features 1-20 boundary/adversarial)
        ├── test_tier3_cross_feature.py      # 20 pairwise cross-feature tests
        └── test_tier4_real_world.py         # 10 end-to-end user workflow scenarios
```

### 3.2 Test Runner Location & Execution Command
The test suite can be executed through either standard Python `unittest` or the enhanced runner:

1. **Standard Unittest Command:**
   ```bash
   python -m unittest discover -s tests/e2e -p "test_*.py"
   ```
2. **Enhanced E2E Suite Runner Command:**
   ```bash
   python tests/run_e2e.py
   ```

### 3.3 Pass/Fail Semantics
- **Zero-Tolerance Defect Model**: Every assertion is hard; all 230 test cases must return code `0` (OK).
- **Self-Contained & Deterministic**: Tests create their own ephemeral isolated fixtures, never mutate persistent workspace files, make no external network calls, and execute identically across platforms.
- **Fail-Fast & Diagnosability**: Each test failure prints the exact input, expected output derived from `PROJECT.md`, observed output, and diff.

---

## 4. Real-World Application Scenarios (Tier 4)

Tier 4 tests model end-to-end real student journeys through the entire CareerPilot system:

1. **Scenario 1 — Fresh Graduate CS Student applying to First Junior Software Engineer Job**:
   Discovery with entry filters -> Save for later -> Multiline JD parse -> Gap categorization (Hard blockers vs preferred) -> Cold email generation with project evidence.
2. **Scenario 2 — Self-Taught Developer transitioning to Frontend Role with GitHub Projects**:
   Connect GitHub profile -> Parse top languages (JavaScript/React) -> Tailor resume with natural language prompt -> Bullet diff review -> Accept grounded bullets.
3. **Scenario 3 — Competitive Programmer leveraging LeetCode Stats for Backend Role**:
   Connect LeetCode (Easy/Med/Hard + Top Ranking) -> Discovery of Backend roles -> Generate personalized LinkedIn outreach (<300 chars) referencing LeetCode problem solving proof.
4. **Scenario 4 — Student recovering from Accidental Application Rejection & Reapplying**:
   Application moved `Applied -> Rejected` -> Reopen state machine transition to `Preparing` -> Tailored resume version retained -> Progress to `Interview`.
5. **Scenario 5 — Anti-Spam Defense against Scraper Traps & Misleading Founding Dates**:
   Search result containing "Bootcamp training program fee required" and "Company founded 15 years ago; 0-2 years experience required" -> Filter correctly eliminates bootcamp and accepts fresher role.
6. **Scenario 6 — International Student with Non-ASCII / Unicode Name & Complex Multiline Resume**:
   Upload resume with unicode symbols and multiline bullets -> TruthGuard validation -> Generate single-column ATS PDF -> Verify ReportLab Platypus rendering and margin constraints.
7. **Scenario 7 — Full End-to-End Application Lifecycle**:
   Search -> Save -> Tailor with STAR Pydantic schema -> Export ATS PDF -> Submit `Saved -> Applied` -> Generate Recruiter Outreach -> Move to `Offer` in Kanban board.
8. **Scenario 8 — Strict Anti-Hallucination Guardrail Execution**:
   Prompt attempting to inject false metrics ("Scaled system to 10M users") without resume evidence -> TruthGuard flags hallucination -> Rewrites to grounded qualitative impact -> Student accepts sanitization.
9. **Scenario 9 — High-Volume Student Managing 50 Applications across 6 Kanban Columns**:
   Bulk application creation -> Status transitions across all 6 columns (`Saved`, `Preparing`, `Applied`, `Assessment`, `Interview`, `Offer`) -> List view / Kanban toggle state integrity.
10. **Scenario 10 — Multi-Platform Evidence Fusion**:
    Simultaneous linkage of LeetCode, GitHub, and LinkedIn -> Profile aggregation -> Automated gap analysis against target tech lead fresher role -> Cohesive recruiter outreach package.

---

## 5. Coverage Thresholds and Checklist

| Criterion | Requirement | Target | Test Location |
|-----------|-------------|--------|---------------|
| Total E2E Tests | >= 230 | 230 | `tests/e2e/` |
| Tier 1: Feature Coverage | >= 5 tests per feature (20 features) | 100 | `test_tier1_feature_coverage.py` |
| Tier 2: Boundary & Corner | >= 5 tests per feature (20 features) | 100 | `test_tier2_boundary_corner.py` |
| Tier 3: Cross-Feature | >= 20 pairwise tests | 20 | `test_tier3_cross_feature.py` |
| Tier 4: Real-World Scenarios | >= 10 end-to-end workflows | 10 | `test_tier4_real_world.py` |
| Execution Runtime | < 15 seconds | ~3.0s | `tests/run_e2e.py` |
| External Network Calls | Strictly 0 (isolated mocks) | 0 | All suites |
| Platform Compatibility | Windows, Linux, macOS | 100% | Python standard library |
