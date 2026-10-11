---
trigger: always_on
---

# Tests and Analysis Rule

Every code change must be validated by systematic tests before it is
considered complete. A change without executed, recorded tests is
unfinished work.

## Test layers

- **Unit tests** — each new or modified function/method is exercised in
  isolation, covering normal inputs, boundary values, and error
  conditions.
- **Integration tests** — the component is exercised with its real
  collaborators (database, relay, chain, BLE stack) or the project's
  standard test doubles when the real dependency is unavailable.
- **Acceptance tests** — business requirements are exercised end to end
  through the same paths a user, agent, or client would use.

## Practices required on every change

- Run the tests affected by the change plus the adjacent suites before
  marking the task done.
- Every bugfix ships with a regression test that fails without the fix.
- New public functions, endpoints, commands, or contract entry points
  ship with at least a happy-path case and an error-path case.
- Tests must be deterministic and isolated: no order dependence, no
  shared mutable state, no real external network calls.
- Never weaken, delete, or skip an existing test to make the suite pass.
- Review generated logs after each run to confirm records are correct.
- Test real scenarios, error conditions, and edge cases — not only the
  happy path.

## White-box testing (progressive)

White-box tests read the implementation, not only its contract. They are
applied progressively: each change extends coverage of the touched
module instead of trying to cover the whole project at once.

- Exercise internal branches, loops, early returns, and exception paths —
  not only inputs and outputs.
- Map every test to a `REQUIREMENTS.md` item or acceptance criterion. A
  requirement is implemented only when a test proves its behavior
  through the real code path; record the requirement ID in the test name
  or docstring.
- Progression order for the modified code: statement coverage → branch
  coverage → condition/path coverage. Track uncovered branches and
  prioritize them by risk (security, keys, funds, data loss first).
- Assert internal invariants and state transitions, not only external
  responses.
- Record which requirement IDs the change validated, per the logging
  and PDCL rules.

## Evidence

For each change, document: commands run, tests added or updated,
results, coverage delta for the touched module, and the requirement IDs
verified. On failure, analyze the root cause, fix it, and re-run the
full chain — never patch the symptom.

## Workspace map

Each subproject has its own `.devin/rules/tests_and_analysis.md` with
stack-specific commands — always prefer the subproject file when working
inside it:

| Subproject | Stack | Test entry points |
|---|---|---|
| `rapport-crypto-p2p-chat/` | React Native / Expo (SDK 57) | `npm test` (`vitest run`), `src/__tests__/` |
| `relay/` | Node.js backend + hosted dApp | `npm run typecheck`, `npm run test:e2e` (Playwright) |
| `smartcontracts/` | Solidity / Hardhat | `npm test` (`hardhat test`), `test/*.ts` |
| `react-native-ble-mesh/` | React Native BLE library | `npm test` (Jest), `npm run test:coverage` |
| `react-native-ble-plx/` | React Native BLE library (pnpm) | `pnpm test`, per-lane `test:*` scripts |
| `docs/`, `assets/` | content | render/preview + link checks |
