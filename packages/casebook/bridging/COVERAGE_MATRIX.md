# Bridging coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area bridging`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality   | ID                                               | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
----------------+--------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
bridge          | bridging-activity-single-entry-and-balances      | Completed bridge shows a single activity entr… | high     | no        | yes      | none               | testlio      
bridge          | bridging-crosschain-promo-banner-visibility      | Cross-chain swaps promo banner shows only in … | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
bridge          | bridging-eth-l2-to-l2-hops                       | Bridge native ETH between two L2s (L2 -> L2 d… | high     | no        | no       | manual-only        | testlio      
bridge          | bridging-eth-to-l2-happy-path                    | Bridge native ETH from mainnet to an L2 compl… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
bridge          | bridging-native-eth-output-not-wrapped           | Bridging ETH previews native ETH (not WETH) a… | high     | no        | yes      | none               | testlio      
bridge          | bridging-review-quote-refresh-and-accept         | Bridge review refreshes the quote and gates t… | high     | no        | yes      | none               | testlio      
bridge          | bridging-supported-pairs-only                    | Bridging is offered only across supported tok… | medium   | no        | yes      | none               | uniswap      
bridge          | bridging-token-selector-bridging-section         | Output/input token selector surfaces a bridgi… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
bridge          | bridging-xlayer-bridge                           | Bridge ETH to X Layer from the swap form       | medium   | no        | yes      | none               | testlio      
crosschain-swap | bridging-crosschain-swap-happy-path              | Cross-chain swap of different tokens complete… | urgent   | no        | yes      | none               | testlio      
crosschain-swap | bridging-crosschain-swap-progress-status         | Cross-chain swap surfaces real-time progress … | high     | no        | yes      | none               | testlio      
crosschain-swap | bridging-crosschain-swap-single-activity-item    | Cross-chain swap is recorded as a single acti… | high     | no        | yes      | none               | testlio      
crosschain-swap | bridging-delegation-batched-crosschain-swap      | Delegated smart wallet completes a batched cr… | high     | no        | no       | manual-only        | testlio      
crosschain-swap | bridging-plan-bridge-step-excluded-from-slippage | Bridge and non-swap steps are excluded from p… | high     | yes       | yes      | pr-unit            | existing-unit
crosschain-swap | bridging-plan-compound-slippage-tolerance        | Chained-action plan compounds per-step slippa… | urgent   | yes       | yes      | pr-unit            | existing-unit
plan-failures   | bridging-plan-price-change-interrupt             | Price change beyond tolerance during plan exe… | urgent   | yes       | yes      | pr-unit            | existing-unit
plan-failures   | bridging-plan-step-failure-surfaces-error        | Failed or unconfirmed plan step finalizes the… | urgent   | yes       | yes      | pr-unit            | existing-unit

Total 17  ·  automated 7  ·  feasible-but-not-automated 8  ·  not feasible 2

Functionality   | Total | Automated | Feasible gap
----------------+-------+-----------+-------------
bridge          | 9     | 3         | 5           
crosschain-swap | 6     | 2         | 3           
plan-failures   | 2     | 2         | 0           

```
