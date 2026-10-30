# Connectors coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area connectors`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                           | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
-----------------+----------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
coinbase-smart-… | connectors-coinbase-custom-meta              | Custom-connector metadata renders Coinbase an… | low      | yes       | yes      | pr-unit            | existing-unit
coinbase-smart-… | connectors-coinbase-smart-wallet-connect     | Connect a Coinbase Smart Wallet via passkey    | high     | no        | no       | manual-only        | testlio      
connection-plum… | connectors-connection-service-error-handling | Connection service ignores expected connectio… | medium   | yes       | yes      | pr-unit            | existing-unit
connection-plum… | connectors-eager-autoconnect                 | Eager auto-connect restores a previously conn… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
connection-plum… | connectors-extension-passkey-auth-popup      | Extension-initiated passkey auth popup verifi… | high     | no        | no       | manual-only        | uniswap      
connection-plum… | connectors-safe-origin-allowlist             | Safe connector only trusts the canonical Safe… | medium   | yes       | yes      | pr-unit            | existing-unit
connection-plum… | connectors-wagmi-transport-ordering          | RPC transport URLs are ordered and de-duplica… | low      | yes       | yes      | pr-unit            | existing-unit
embedded-wallet  | connectors-embedded-create-account           | Create Account closes the panel and opens the… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
embedded-wallet  | connectors-embedded-fiat-connect             | Connect an embedded (passkey) wallet from the… | high     | no        | no       | manual-only        | testlio      
embedded-wallet  | connectors-embedded-oauth-login              | Log in offers Google/Apple OAuth and email re… | high     | yes       | yes      | pr-unit            | existing-unit
embedded-wallet  | connectors-embedded-open-connections-panel   | Connect opens the Embedded Wallet connections… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
embedded-wallet  | connectors-embedded-passkey-add              | Add a new passkey authenticator to the embedd… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
embedded-wallet  | connectors-embedded-passkey-delete           | Delete a passkey authenticator with speedbump… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
embedded-wallet  | connectors-embedded-registration-steps       | Embedded Wallet registration walks ChooseUnit… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
injected-connec… | connectors-injected-connect                  | Connect an injected browser-extension wallet … | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
injected-connec… | connectors-injected-disconnect               | Disconnect a connected injected wallet         | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
injected-connec… | connectors-injected-wallet-options-list      | All supported connectors appear as options in… | high     | yes       | yes      | pr-unit            | testlio      
injected-connec… | connectors-metamask-detection-ordering       | MetaMask ordering depends on extension detect… | medium   | yes       | yes      | pr-unit            | existing-unit
injected-connec… | connectors-multiplatform-dedup               | Same-named EVM and Solana connectors merge in… | low      | yes       | yes      | pr-unit            | existing-unit
injected-connec… | connectors-recent-wallet-badge               | Most-recently-used connector is surfaced firs… | medium   | yes       | yes      | pr-unit            | testlio      

Total 20  ·  automated 17  ·  feasible-but-not-automated 0  ·  not feasible 3

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
coinbase-smart-… | 2     | 1         | 0           
connection-plum… | 5     | 4         | 0           
embedded-wallet  | 7     | 6         | 0           
injected-connec… | 6     | 6         | 0           

```
