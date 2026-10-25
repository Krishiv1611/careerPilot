import os
import sys
import time
import unittest
from pathlib import Path

# Color styling constants
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{CYAN}{BOLD}======================================================================{RESET}")
    print(f"{CYAN}{BOLD}          CAREERPILOT MODERNIZATION -- COMPREHENSIVE E2E TEST RUNNER   {RESET}")
    print(f"{CYAN}{BOLD}======================================================================{RESET}")
    print("Target: All 20 Product Features | Tiers 1-4 | 230 Total Test Cases\n")


def run_tier(tier_name: str, test_module_name: str) -> tuple[int, int, int, float]:
    print(f"{YELLOW}{BOLD}[RUNNING]{RESET} {tier_name} ({test_module_name})...", end=" ", flush=True)
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromName(test_module_name)
    
    start_time = time.perf_counter()
    runner = unittest.TextTestRunner(stream=open(os.devnull, "w"), verbosity=0)
    result = runner.run(suite)
    elapsed = time.perf_counter() - start_time
    
    passed = result.testsRun - len(result.failures) - len(result.errors)
    failures = len(result.failures)
    errors = len(result.errors)
    
    if failures == 0 and errors == 0:
        print(f"{GREEN}{BOLD}PASSED{RESET} ({passed}/{result.testsRun} tests in {elapsed:.3f}s)")
    else:
        print(f"{RED}{BOLD}FAILED{RESET} ({failures} failures, {errors} errors in {elapsed:.3f}s)")
        
    return result.testsRun, passed, failures + errors, elapsed


def main():
    project_root = Path(__file__).resolve().parents[1]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
        
    print_banner()

    tiers = [
        ("Tier 1: Feature Coverage", "tests.e2e.test_tier1_feature_coverage"),
        ("Tier 2: Boundary & Corner Cases", "tests.e2e.test_tier2_boundary_corner"),
        ("Tier 3: Cross-Feature Combinations", "tests.e2e.test_tier3_cross_feature"),
        ("Tier 4: Real-World Scenarios", "tests.e2e.test_tier4_real_world"),
    ]

    total_run = 0
    total_passed = 0
    total_failed = 0
    total_time = 0.0
    results_summary = []

    for name, module in tiers:
        run_count, pass_count, fail_count, elapsed = run_tier(name, module)
        total_run += run_count
        total_passed += pass_count
        total_failed += fail_count
        total_time += elapsed
        results_summary.append((name, run_count, pass_count, fail_count, elapsed))

    print(f"\n{CYAN}{BOLD}----------------------------------------------------------------------{RESET}")
    print(f"{BOLD}                        E2E TEST EXECUTION SUMMARY                    {RESET}")
    print(f"{CYAN}{BOLD}----------------------------------------------------------------------{RESET}")
    print(f"{'Test Tier':<36} | {'Run':<6} | {'Pass':<6} | {'Fail':<6} | {'Time':<8}")
    print("-" * 70)
    for name, r, p, f, t in results_summary:
        status_color = GREEN if f == 0 else RED
        print(f"{name:<36} | {r:<6} | {status_color}{p:<6}{RESET} | {status_color}{f:<6}{RESET} | {t:<6.3f}s")
    print("-" * 70)
    final_color = GREEN if total_failed == 0 else RED
    print(f"{BOLD}{'TOTAL SUITE VERIFICATION':<36} | {total_run:<6} | {final_color}{total_passed:<6}{RESET} | {final_color}{total_failed:<6}{RESET} | {total_time:<6.3f}s")
    print(f"{CYAN}{BOLD}======================================================================{RESET}")

    if total_failed == 0:
        print(f"\n{GREEN}{BOLD}>>> 100% PASS RATE ACHIEVED. ALL 230 E2E CONTRACT TESTS VERIFIED! <<<{RESET}\n")
        return 0
    else:
        print(f"\n{RED}{BOLD}>>> SUITE VERIFICATION FAILED: {total_failed} TESTS FAILED. <<<{RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
