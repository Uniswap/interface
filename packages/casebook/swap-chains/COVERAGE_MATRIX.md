# Swap Chains coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area swap.chains`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                       | Title                                          | Priority | Automated | Feasible | CI execution    | Source       
-----------------+------------------------------------------+------------------------------------------------+----------+-----------+----------+-----------------+--------------
established-cha… | swap-chains-arbitrum-swap-smoke          | Swap on Arbitrum One completes and updates ba… | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-avalanche-swap-smoke         | Swap on Avalanche completes and updates balan… | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-base-swap-smoke              | Swap on Base completes and updates balances    | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-bnb-swap-smoke               | Swap on BNB Chain completes and updates balan… | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-celo-swap-smoke              | Swap on Celo completes and updates balances    | medium   | no        | yes      | none            | testlio      
established-cha… | swap-chains-chain-info-rpc-resolution    | RPC endpoint resolution handles every support… | medium   | yes       | yes      | pr-unit         | existing-unit
established-cha… | swap-chains-ethereum-swap-smoke          | Swap on Ethereum mainnet completes and update… | urgent   | yes       | yes      | scheduled-anvil | existing-e2e 
established-cha… | swap-chains-optimism-swap-smoke          | Swap on Optimism completes and updates balanc… | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-polygon-swap-smoke           | Swap on Polygon completes and updates balances | high     | no        | yes      | none            | testlio      
established-cha… | swap-chains-worldchain-swap-smoke        | Swap on World Chain completes and updates bal… | medium   | no        | yes      | none            | testlio      
established-cha… | swap-chains-zksync-swap-smoke            | Swap on ZKsync completes and updates balances  | medium   | no        | yes      | none            | testlio      
established-cha… | swap-chains-zora-swap-smoke              | Swap on Zora completes and updates balances    | medium   | no        | yes      | none            | testlio      
network-selecti… | swap-chains-app-support-invariants       | Chain app-support invariants hold (Solana web… | high     | yes       | yes      | pr-unit         | existing-unit
network-selecti… | swap-chains-chain-id-conversion          | Chain-id conversion helpers round-trip suppor… | medium   | yes       | yes      | pr-unit         | existing-unit
network-selecti… | swap-chains-enabled-chains-resolution    | getEnabledChains resolves mainnet, feature-fl… | high     | yes       | yes      | pr-unit         | existing-unit
network-selecti… | swap-chains-network-badge-on-tokens      | Selected-chain badge and swap toast reflect t… | medium   | no        | yes      | none            | testlio      
network-selecti… | swap-chains-network-filter-switching     | Network filter switches the active swap chain… | high     | no        | yes      | none            | testlio      
network-selecti… | swap-chains-paste-token-address-on-chain | Pasting a token address resolves the token on… | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-linea-swap-smoke             | Swap on Linea completes and updates balances   | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-megaeth-swap-smoke           | Swap on MegaETH completes and updates balances | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-monad-swap-smoke             | Swap on Monad completes and updates balances   | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-robinhood-swap-smoke         | Swap on Robinhood Chain completes and updates… | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-soneium-swap-smoke           | Swap on Soneium completes and updates balances | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-tempo-swap-smoke             | Swap on Tempo completes and updates balances   | medium   | no        | yes      | none            | testlio      
new-chains       | swap-chains-unichain-swap-smoke          | Swap on Unichain completes and updates balanc… | high     | no        | yes      | none            | testlio      
new-chains       | swap-chains-xlayer-swap-smoke            | Swap on X Layer completes and updates balances | medium   | no        | yes      | none            | testlio      

Total 26  ·  automated 5  ·  feasible-but-not-automated 21  ·  not feasible 0

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
established-cha… | 12    | 2         | 10          
network-selecti… | 6     | 3         | 3           
new-chains       | 8     | 0         | 8           

```
