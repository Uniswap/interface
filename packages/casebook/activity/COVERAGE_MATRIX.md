# Activity coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area activity`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                                     | Title                                          | Priority | Automated | Feasible | CI execution | Source       
--------------+--------------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
cancel        | activity-cancel-classic-general                        | Cancel a pending classic transaction from Act… | urgent   | no        | yes      | none         | testlio      
cancel        | activity-cancel-extension                              | Cancel a pending transaction from the extensi… | urgent   | no        | yes      | none         | testlio      
cancel        | activity-cancel-order-factory-build                    | Cancel order factory builds valid single and … | high     | yes       | yes      | pr-unit      | existing-unit
cancel        | activity-cancel-uniswapx                               | Cancel a pending UniswapX order from Activity  | urgent   | no        | yes      | none         | testlio      
cancel        | activity-cancellation-gas-fee                          | Cancellation gas fee is computed for a replac… | high     | yes       | yes      | pr-unit      | existing-unit
history       | activity-bridge-detail-modal                           | Bridge transaction detail modal shows source … | medium   | no        | yes      | none         | testlio      
history       | activity-copy-transaction-id                           | Copy Transaction ID shows a copied toast that… | low      | no        | yes      | none         | testlio      
history       | activity-empty-state-no-transactions                   | Empty activity state shown for a wallet with … | low      | no        | yes      | none         | testlio      
history       | activity-filter-by-chain                               | Activity list filters transactions by selecte… | medium   | yes       | yes      | pr-unit      | existing-unit
history       | activity-filter-limit-orders                           | Limit orders are filtered out of the standard… | medium   | yes       | yes      | pr-unit      | existing-unit
history       | activity-history-list-general                          | Activity tab renders confirmed transaction hi… | high     | no        | yes      | none         | testlio      
history       | activity-history-load-more-pagination                  | Activity list paginates older transactions on… | medium   | yes       | yes      | pr-unit      | testlio      
history       | activity-merge-local-remote-transactions               | Local and remote transactions merge without d… | urgent   | yes       | yes      | pr-unit      | existing-unit
history       | activity-plan-details-extraction                       | Plan details are extracted correctly from DAP… | medium   | yes       | yes      | pr-unit      | existing-unit
history       | activity-swap-detail-modal                             | Swap transaction detail modal shows accurate … | high     | no        | yes      | none         | testlio      
history       | activity-tab-extension-full-flow                       | Extension Activity tab renders, filters and l… | high     | no        | yes      | none         | testlio      
history       | activity-transaction-summary-title                     | Transaction summary titles map correctly per … | medium   | yes       | yes      | pr-unit      | existing-unit
notifications | activity-notification-receive-build                    | Receive notification object is built correctl… | medium   | yes       | yes      | pr-unit      | existing-unit
notifications | activity-notification-watcher-swap-approve-suppression | Notification watcher builds swap/approve noti… | high     | yes       | yes      | pr-unit      | existing-unit
notifications | activity-push-notifications-disabled                   | Disabling push notifications suppresses OS pu… | high     | no        | no       | manual-only  | testlio      
notifications | activity-push-notifications-enabled                    | Enabling push notifications delivers an OS pu… | high     | no        | no       | manual-only  | testlio      
notifications | activity-toaster-dapp-connected                        | Dapp connected/confirmed toasts show correct … | medium   | no        | yes      | none         | testlio      
notifications | activity-toaster-extension                             | Extension toasts for swap, connect, send and … | medium   | no        | yes      | none         | testlio      
notifications | activity-toaster-receive-token                         | Receive toast appears when a wallet receives … | medium   | no        | yes      | none         | testlio      
notifications | activity-toaster-swap-confirmed                        | Swap confirmed toast appears after a successf… | high     | no        | yes      | none         | testlio      
pending       | activity-fiat-onramp-tx-watcher                        | Fiat on-ramp purchase watcher updates and pru… | medium   | yes       | yes      | pr-unit      | existing-unit
pending       | activity-pending-nonce-invalidation-on-backgrounding   | Stale pending transaction invalidated when no… | high     | yes       | yes      | pr-unit      | existing-unit
pending       | activity-pending-queued-extension                      | Second concurrent swap shows Queued state on … | medium   | no        | yes      | none         | testlio      
pending       | activity-pending-stuck-poll-exhaustion                 | Stuck classic transaction emits PendingTransa… | urgent   | yes       | yes      | pr-unit      | existing-unit
pending       | activity-pending-two-concurrent-swaps                  | Two concurrent swaps both show pending then c… | high     | no        | yes      | none         | testlio      
pending       | activity-pending-watcher-finalizes-confirmed           | Transaction watcher finalizes a successful on… | urgent   | yes       | yes      | pr-unit      | existing-unit
pending       | activity-tx-watcher-orchestration                      | Transaction watcher orchestrates per-transact… | high     | yes       | yes      | pr-unit      | existing-unit

Total 32  ·  automated 15  ·  feasible-but-not-automated 15  ·  not feasible 2

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
cancel        | 5     | 2         | 3           
history       | 12    | 6         | 6           
notifications | 8     | 2         | 4           
pending       | 7     | 5         | 2           

```
