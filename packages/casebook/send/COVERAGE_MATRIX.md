# Send coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area send`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
-----------------+-----------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
core             | send-amount-fiat-token-toggle     | Toggling fiat/token input keeps the send amou… | medium   | yes       | yes      | pr-unit            | existing-unit
core             | send-decimal-pad-caret-position   | Decimal pad caret stays correctly positioned … | medium   | no        | yes      | none               | uniswap      
core             | send-eth-happy-path-web           | Send native ETH to a recipient completes on-c… | urgent   | yes       | yes      | scheduled-anvil    | existing-e2e 
core             | send-eth-self-send-mobile         | Send ETH to self via the mobile send flow (Ma… | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
core             | send-extension-flow               | Send flow works end-to-end from the extension… | high     | no        | yes      | none               | testlio      
core             | send-french-locale-general        | Send flow renders correctly with the device l… | medium   | no        | no       | manual-only        | testlio      
core             | send-insufficient-balance-blocked | Send is blocked when the amount exceeds avail… | urgent   | yes       | yes      | pr-unit            | existing-unit
core             | send-max-amount                   | Max button fills the maximum sendable balance  | medium   | no        | yes      | none               | testlio      
core             | send-review-modal-amount-display  | Send review shows the correct token and fiat … | high     | yes       | yes      | pr-unit            | existing-unit
core             | send-token-saga-transfer-types    | sendTokenSaga builds and dispatches transfers… | urgent   | yes       | yes      | pr-unit            | existing-unit
recipient-resol… | send-incomplete-form-warnings     | Send is gated until recipient and amount are … | medium   | yes       | yes      | pr-unit            | existing-unit
recipient-resol… | send-recent-transfers-suggestions | Recent-transfer recipients are surfaced, dedu… | medium   | yes       | yes      | pr-unit            | existing-unit
recipient-resol… | send-recipient-address-input      | Recipient input accepts and validates a raw a… | high     | yes       | yes      | pr-unit            | existing-unit
recipient-resol… | send-recipient-ens-resolution     | ENS name resolves to a verified recipient      | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
recipient-resol… | send-recipient-unitag             | Recipient displays correctly when resolved to… | medium   | yes       | yes      | pr-unit            | existing-unit
safety-and-gati… | send-insufficient-gas-copy        | Review button switches to insufficient-funds … | medium   | yes       | yes      | pr-unit            | existing-unit
safety-and-gati… | send-new-address-speedbump        | New-address speedbump warns before sending to… | high     | yes       | yes      | scheduled-anvil    | existing-e2e 
safety-and-gati… | send-offline-blocked              | Send is gated with a network warning while th… | medium   | yes       | yes      | pr-unit            | existing-unit
safety-and-gati… | send-permissioned-token-gating    | Permissioned-token send is gated by sender an… | urgent   | yes       | yes      | pr-unit            | existing-unit
safety-and-gati… | send-self-send-speedbump          | Self-send speedbump modal renders its warning… | high     | yes       | yes      | pr-unit            | existing-unit
safety-and-gati… | send-smart-contract-speedbump     | Smart-contract speedbump modal renders its wa… | high     | yes       | yes      | pr-unit            | existing-unit

Total 21  ·  automated 17  ·  feasible-but-not-automated 3  ·  not feasible 1

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
core             | 10    | 6         | 3           
recipient-resol… | 5     | 5         | 0           
safety-and-gati… | 6     | 6         | 0           

```
