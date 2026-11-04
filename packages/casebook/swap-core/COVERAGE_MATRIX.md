# Swap coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area swap.core`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality  | ID                                          | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
---------------+---------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
allowance      | swap-core-allowance-expired-permit          | Expired Permit2 approval re-prompts a signatu… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
allowance      | swap-core-allowance-insufficient-permit     | Insufficient existing Permit2 approval re-pro… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
allowance      | swap-core-allowance-zero-approve-erc20      | Swap requests ERC20 approve when Permit2 has … | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
allowance      | swap-core-allowance-zero-permit-signature   | Swap prompts a Permit2 signature when no perm… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
core           | swap-core-analytics-time-to-swap-logging    | Time-to-swap analytics events are logged acro… | low      | yes       | yes      | scheduled-anvil    | existing-e2e 
core           | swap-core-clear-dependent-input             | Clearing the independent input resets the dep… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
core           | swap-core-decimal-pad-caret-position        | Decimal pad caret stays correctly positioned … | medium   | no        | yes      | none               | uniswap      
core           | swap-core-exact-input-happy-path            | Exact-input swap completes and updates balanc… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
core           | swap-core-exact-output                      | Exact-output swap derives and swaps the corre… | urgent   | no        | yes      | none               | uniswap      
core           | swap-core-flow-general-extension            | Extension side-panel swap flow completes end … | high     | no        | yes      | none               | testlio      
core           | swap-core-form-defaults-from-url            | Swap form defaults inputs from URL params      | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
core           | swap-core-reverse-token-direction           | Reversing token direction swaps input/output … | high     | no        | yes      | none               | uniswap      
core           | swap-core-settings-menu-open-close          | Swap settings menu opens and closes on deskto… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
core           | swap-core-token-selector-sections           | Token selector shows top-token and bridging s… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
routing        | swap-core-routing-erc20-to-erc20            | ERC20-to-ERC20 swap (WETH -> WBTC)             | high     | no        | yes      | none               | testlio      
routing        | swap-core-routing-protocol-preferences-unit | Protocol preference filtering selects the cor… | high     | yes       | yes      | pr-unit            | existing-unit
routing        | swap-core-routing-v2                        | Swap routes through a V2 pool                  | high     | no        | yes      | none               | testlio      
routing        | swap-core-routing-v3                        | Swap routes through a V3 pool                  | high     | no        | yes      | none               | testlio      
routing        | swap-core-routing-v4                        | Swap routes through a V4 pool                  | high     | no        | yes      | none               | testlio      
slippage-fees  | swap-core-fees-displayed-on-fee-routes      | Swap fee is shown and applied on fee-bearing … | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
slippage-fees  | swap-core-flashblocks-fast-confirm          | Flashblocks swap confirms via the fast-confir… | high     | no        | no       | manual-only        | testlio      
slippage-fees  | swap-core-fot-buy-normal-slippage           | FOT token buy applies correct fee-adjusted am… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
slippage-fees  | swap-core-fot-sell-one-percent-slippage     | FOT token sell at 1% slippage executes with f… | high     | no        | yes      | none               | testlio      
slippage-fees  | swap-core-fot-unibot-bullet                 | FOT swap between Unibot and Bullet applies bo… | high     | no        | yes      | none               | testlio      
slippage-fees  | swap-core-slippage-manual-adjustment        | Manual slippage adjustment is applied to the … | high     | no        | yes      | none               | testlio      
slippage-fees  | swap-core-slippage-tolerance-calc-unit      | Compound slippage tolerance is computed corre… | urgent   | yes       | yes      | pr-unit            | existing-unit
slippage-fees  | swap-core-sponsored-gasless                 | Sponsored (gasless) swap executes without cha… | urgent   | no        | yes      | none               | testlio      
slippage-fees  | swap-core-sponsorship-validation-unit       | Sponsorship delivery is validated and resolve… | high     | yes       | yes      | pr-unit            | existing-unit
slippage-fees  | swap-core-testnet-mode                      | Testnet swap executes end-to-end in testnet m… | medium   | no        | no       | manual-only        | testlio      
uniswapx-limit | swap-core-limit-order-token-approval        | Limit order on an ERC20 input approves the to… | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
uniswapx-limit | swap-core-limit-order-wrap-first-step       | Limit order on native ETH wraps to WETH as it… | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
uniswapx-limit | swap-core-limit-place-and-cancel            | Limit order can be placed at a chosen price, … | high     | no        | yes      | none               | testlio      
uniswapx-limit | swap-core-uniswapx-cancel-pending           | Pending UniswapX order can be cancelled        | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
uniswapx-limit | swap-core-uniswapx-dedupe-orders            | Remote and local UniswapX orders are de-dupli… | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
uniswapx-limit | swap-core-uniswapx-order-expiry             | Expired UniswapX order shows the error view    | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
uniswapx-limit | swap-core-uniswapx-signed-order             | UniswapX swap places and fills a signed order… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
warnings       | swap-core-protection-private-rpc            | Swap protection (private RPC) routes the tran… | high     | no        | no       | manual-only        | testlio      
warnings       | swap-core-warning-blocked-token             | Blocked token cannot be swapped                | urgent   | yes       | yes      | pr-unit            | existing-unit
warnings       | swap-core-warning-insufficient-balance      | Insufficient balance disables the swap CTA     | high     | yes       | yes      | pr-unit            | existing-unit
wrap           | swap-core-unwrap-weth                       | Unwrap WETH to native ETH bypasses routing 1:1 | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
wrap           | swap-core-wrap-native-eth                   | Wrap native ETH to WETH bypasses routing 1:1   | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 

Total 41  ·  automated 25  ·  feasible-but-not-automated 13  ·  not feasible 3

Functionality  | Total | Automated | Feasible gap
---------------+-------+-----------+-------------
allowance      | 4     | 4         | 0           
core           | 10    | 6         | 4           
routing        | 5     | 1         | 4           
slippage-fees  | 10    | 4         | 4           
uniswapx-limit | 7     | 6         | 1           
warnings       | 3     | 2         | 0           
wrap           | 2     | 2         | 0           

```
