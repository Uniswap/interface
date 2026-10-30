# Swap coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area swap.core`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                | Title                                          | Priority | Automated | Feasible | CI execution | Source 
--------------+-----------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------
core          | swap-core-exact-input-happy-path  | Exact-input swap completes and updates balanc… | urgent   | no        | yes      | none         | testlio
core          | swap-core-reverse-token-direction | Reversing token direction swaps input/output … | high     | no        | yes      | none         | testlio
core          | swap-core-wrap-unwrap-native      | Wrap and unwrap native token bypasses routing  | high     | no        | yes      | none         | uniswap

Total 3  ·  automated 0  ·  feasible-but-not-automated 3  ·  not feasible 0

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
core          | 3     | 0         | 3           

```
