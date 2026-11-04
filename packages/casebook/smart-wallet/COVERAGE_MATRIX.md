# Smart Wallet coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area smart_wallet`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                                      | Title                                          | Priority | Automated | Feasible | CI execution | Source       
-----------------+---------------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
delegation-batc… | smart-wallet-batch-call-status                          | getCallsStatusHelper reports Pending/Success/… | urgent   | yes       | yes      | pr-unit      | existing-unit
delegation-batc… | smart-wallet-batched-calls-transform                    | Batched calls transform to transaction reques… | high     | yes       | yes      | pr-unit      | existing-unit
delegation-batc… | smart-wallet-delegation-batched-cross-network-swap      | Delegation activates during a cross-network (… | urgent   | no        | yes      | none         | testlio      
delegation-batc… | smart-wallet-delegation-batched-swap-mainnet            | First swap on mainnet activates EIP-7702 dele… | urgent   | no        | yes      | none         | testlio      
delegation-batc… | smart-wallet-delegation-batched-swap-per-chain          | First swap activates delegation on each suppo… | high     | no        | yes      | none         | testlio      
delegation-batc… | smart-wallet-delegation-network-cost-banner             | Review screen surfaces the "Includes Smart Wa… | high     | yes       | yes      | pr-unit      | existing-unit
delegation-batc… | smart-wallet-delegation-subsequent-swap-no-redelegation | Subsequent swap on an already-delegated walle… | urgent   | no        | yes      | none         | testlio      
delegation-batc… | smart-wallet-extension-eth-eth-uni                      | Extension swaps mainnet ETH to ETH on Unichai… | urgent   | no        | yes      | none         | testlio      
delegation-batc… | smart-wallet-fund-wallet-additional-networks            | Fund a smart wallet across additional network… | medium   | no        | no       | manual-only  | testlio      
delegation-batc… | smart-wallet-gas-fees-group-by-symbol                   | Smart-wallet gas fees group by token symbol    | medium   | yes       | yes      | pr-unit      | existing-unit
delegation-batc… | smart-wallet-userop-transform-eip7702                   | Trading-API userOp transforms to an RPC userO… | urgent   | yes       | yes      | pr-unit      | existing-unit
external-dapp-b… | smart-wallet-external-dapp-batched-swap-mainnet         | External dapp batched swap executes as a sing… | urgent   | no        | yes      | none         | testlio      
external-dapp-b… | smart-wallet-external-dapp-bundled-review-warning       | Incoming external batch shows bundled-transac… | high     | no        | yes      | none         | testlio      
external-dapp-b… | smart-wallet-web-batched-activity-polling               | Web activity polling finalizes pending EIP-57… | high     | yes       | yes      | pr-unit      | existing-unit
flashblocks-pre… | smart-wallet-flashblocks-non-delegated-baseline         | Swap with a non-delegated wallet on a Flashbl… | medium   | no        | yes      | none         | testlio      
flashblocks-pre… | smart-wallet-flashblocks-non-flashblocks-baseline       | Same pre-delegated swap on a non-Flashblocks … | medium   | no        | yes      | none         | testlio      
flashblocks-pre… | smart-wallet-flashblocks-predelegated-fast-confirm      | Swap with a pre-delegated wallet shows fast c… | high     | no        | yes      | none         | testlio      
manage-delegati… | smart-wallet-account-mismatch-detection                 | Account mismatch detection identifies delegat… | high     | yes       | yes      | pr-unit      | existing-unit
manage-delegati… | smart-wallet-delegation-service-multichain-status       | Delegation service resolves delegation status… | urgent   | yes       | yes      | pr-unit      | existing-unit
manage-delegati… | smart-wallet-delegation-state-effects                   | Delegation-state effects update state and act… | high     | yes       | yes      | pr-unit      | existing-unit
manage-delegati… | smart-wallet-detect-delegated-eoa                       | isDelegatedEOA correctly detects delegation f… | urgent   | yes       | yes      | pr-unit      | existing-unit
manage-delegati… | smart-wallet-manage-action-required-disable             | Action-required wallet can be disabled across… | urgent   | no        | yes      | none         | testlio      
manage-delegati… | smart-wallet-manage-delegations-status-sections         | Smart wallet settings groups wallets into Ina… | high     | yes       | yes      | pr-unit      | existing-unit
manage-delegati… | smart-wallet-manage-disable-no-delegations              | Disabling an Active wallet with zero active n… | medium   | no        | yes      | none         | testlio      
manage-delegati… | smart-wallet-manage-disable-with-delegations            | Disabling an Active wallet with delegations r… | urgent   | no        | yes      | none         | testlio      
manage-delegati… | smart-wallet-manage-enable-smart-wallet                 | Enabling an inactive wallet moves it to Active | high     | no        | yes      | none         | testlio      
manage-delegati… | smart-wallet-manage-unavailable-non-uniswap-delegation  | Wallet with a non-Uniswap delegation shows th… | high     | no        | yes      | none         | testlio      

Total 27  ·  automated 11  ·  feasible-but-not-automated 15  ·  not feasible 1

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
delegation-batc… | 11    | 5         | 5           
external-dapp-b… | 3     | 1         | 2           
flashblocks-pre… | 3     | 0         | 3           
manage-delegati… | 10    | 5         | 5           

```
