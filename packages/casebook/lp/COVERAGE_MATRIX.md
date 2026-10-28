# LP coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area lp.add_remove`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                | Title                                          | Priority | Automated | Feasible | CI execution    | Source       
--------------+-----------------------------------+------------------------------------------------+----------+-----------+----------+-----------------+--------------
create        | lp-create-approval-v4             | Token approval flow during V4 position creati… | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-custom-fee-tier         | Create position with custom fee tier           | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-dynamic-fee-tier        | Create position with dynamic fee tier and hook | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-dynamic-slippage-high   | Very high slippage warning with cancel recove… | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-dynamic-slippage-low    | Low slippage warning on correlated pair (e.g.… | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-error-recovery          | Graceful error handling during create positio… | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-fot-token-warning       | Fee-on-transfer token shows warning during cr… | high     | no        | yes      | none            | uniswap      
create        | lp-create-insufficient-gas        | Create position blocked when gas is insuffici… | high     | no        | yes      | none            | uniswap      
create        | lp-create-new-pool-deploys        | Creating new liquidity pool deploys and initi… | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-permit2-already-set     | Skip permit2 approval when allowance already … | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-tx-context-v4           | CreatePositionTxContext produces correct tx r… | urgent   | yes       | yes      | pr-unit         | existing-unit
create        | lp-create-v2-no-pair              | Create V2 pair when none exists                | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-v2-position             | Create V2 liquidity position                   | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-v2-zero-liquidity       | Create V2 position in pool with zero liquidity | high     | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-v3-position             | Create V3 position (full and custom range)     | urgent   | no        | yes      | none            | testlio      
create        | lp-create-v4-custom-range         | Create V4 position with custom price range     | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
create        | lp-create-v4-full-range           | Create V4 position with full range             | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
increase      | lp-increase-error-recovery        | Graceful error handling during increase liqui… | high     | yes       | yes      | scheduled-anvil | existing-e2e 
increase      | lp-increase-insufficient-balance  | Increase blocked when balance is insufficient  | high     | no        | yes      | none            | uniswap      
increase      | lp-increase-native-eth            | Increase position with native ETH (wrap to WE… | urgent   | no        | yes      | none            | uniswap      
increase      | lp-increase-permit2-already-set   | Skip permit2 approval on increase when allowa… | high     | yes       | yes      | scheduled-anvil | existing-e2e 
increase      | lp-increase-tx-context            | IncreaseLiquidityTxContext produces correct t… | urgent   | no        | yes      | none            | uniswap      
increase      | lp-increase-v2-add-back           | Add liquidity back to V2 position after parti… | high     | no        | yes      | none            | testlio      
increase      | lp-increase-v3-approval           | Approve and increase liquidity on V3 position  | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
increase      | lp-increase-v4-approval           | Approve and increase liquidity on V4 position  | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
increase      | lp-increase-v4-happy-path         | Increase liquidity on existing V4 position     | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
lifecycle     | lp-add-remove-embedded-wallet     | Add and remove liquidity with embedded (passk… | high     | no        | no       | manual-only     | testlio      
lifecycle     | lp-add-remove-hooked-pool         | Add and remove liquidity on V4 hooked pool     | high     | no        | yes      | none            | testlio      
lifecycle     | lp-add-remove-p2-chains           | Add and remove liquidity on secondary chains   | medium   | no        | yes      | none            | testlio      
lifecycle     | lp-lifecycle-full-round-trip      | Full position lifecycle: create → increase → … | urgent   | no        | yes      | none            | testlio      
lifecycle     | lp-liquidity-saga                 | Liquidity saga orchestrates full LP transacti… | urgent   | no        | yes      | none            | uniswap      
lifecycle     | lp-liquidity-service-client       | LiquidityService API client handles requests … | urgent   | no        | yes      | none            | uniswap      
lifecycle     | lp-tx-steps-generation            | LP transaction steps are generated correctly … | urgent   | yes       | yes      | pr-unit         | existing-unit
remove        | lp-remove-error-tx-failure        | Remove liquidity handles transaction failure … | high     | no        | yes      | none            | uniswap      
remove        | lp-remove-native-eth-unwrap       | Remove liquidity with native ETH unwrap        | urgent   | no        | yes      | none            | uniswap      
remove        | lp-remove-receive-as-weth         | Remove liquidity keeping WETH (no unwrap)      | high     | no        | yes      | none            | uniswap      
remove        | lp-remove-review-displays-amounts | Remove review screen displays correct token a… | urgent   | no        | yes      | none            | uniswap      
remove        | lp-remove-slider-custom-percent   | Remove custom percentage via slider input      | high     | no        | yes      | none            | uniswap      
remove        | lp-remove-tx-context              | RemoveLiquidityTxContext produces correct tx … | urgent   | no        | yes      | none            | uniswap      
remove        | lp-remove-v2-position             | Remove liquidity from V2 position              | high     | no        | yes      | none            | uniswap      
remove        | lp-remove-v3-position             | Remove liquidity from V3 position              | urgent   | no        | yes      | none            | uniswap      
remove        | lp-remove-v4-25-percent           | Decrease 25% of V4 position liquidity          | urgent   | no        | yes      | none            | testlio      
remove        | lp-remove-v4-75-percent           | Decrease 75% of V4 position liquidity          | urgent   | no        | yes      | none            | testlio      
remove        | lp-remove-v4-decrease-50          | Decrease 50% of V4 position liquidity          | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
remove        | lp-remove-v4-max                  | Remove 100% (Max) of V4 position liquidity     | urgent   | no        | yes      | none            | testlio      

Total 45  ·  automated 21  ·  feasible-but-not-automated 23  ·  not feasible 1

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
create        | 17    | 14        | 3           
increase      | 9     | 5         | 4           
lifecycle     | 7     | 1         | 5           
remove        | 12    | 1         | 11          

```
