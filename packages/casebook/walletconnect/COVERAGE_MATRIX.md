# WalletConnect coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area walletconnect`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality  | ID                                              | Title                                          | Priority | Automated | Feasible | CI execution | Source       
---------------+-------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
extension-dapp | walletconnect-blockaid-threat-warning           | Malicious or unverified dapps surface a risk … | high     | yes       | yes      | pr-unit      | existing-unit
extension-dapp | walletconnect-ext-account-switch-reconnect      | Switching accounts in the extension updates t… | medium   | yes       | yes      | pr-unit      | testlio      
extension-dapp | walletconnect-ext-change-chain-bidirectional    | Chain switches sync between the dapp and the … | high     | yes       | yes      | pr-unit      | testlio      
extension-dapp | walletconnect-ext-connection-prompt-and-approve | Navigating to a dapp prompts a connection tha… | high     | yes       | yes      | pr-e2e       | testlio      
extension-dapp | walletconnect-ext-message-signing               | personal_sign / eth_signTypedData requests fr… | high     | no        | yes      | none         | uniswap      
extension-dapp | walletconnect-ext-permissioned-swap-gate        | Permissioned (KYC-gated) token swaps via a da… | high     | yes       | yes      | pr-unit      | existing-unit
extension-dapp | walletconnect-ext-request-queue                 | Multiple pending dapp requests queue and are … | medium   | no        | yes      | none         | testlio      
extension-dapp | walletconnect-ext-stale-request-handling        | Stale dapp requests are blocked from confirma… | high     | yes       | yes      | pr-unit      | existing-unit
extension-dapp | walletconnect-ext-transaction-request-confirm   | Dapp-initiated transaction request shows a co… | urgent   | no        | yes      | none         | testlio      
requests       | walletconnect-batched-sendcalls-request         | wallet_sendCalls (EIP-5792 batched) and walle… | high     | yes       | yes      | pr-unit      | existing-unit
requests       | walletconnect-decode-message-for-signing        | Hex-encoded messages are decoded to human-rea… | high     | yes       | yes      | pr-unit      | existing-unit
requests       | walletconnect-personal-sign-and-typed-data      | personal_sign / eth_sign / eth_signTypedData … | high     | yes       | yes      | pr-unit      | existing-unit
requests       | walletconnect-self-call-with-data-blocked       | Dapp-originated self-calls with data (scam si… | high     | yes       | yes      | pr-unit      | existing-unit
requests       | walletconnect-supported-chain-filtering         | Unsupported chains in a proposal/request are … | medium   | yes       | yes      | pr-unit      | existing-unit
requests       | walletconnect-transaction-request-approval      | Dapp transaction request prompts, and approva… | urgent   | no        | yes      | none         | testlio      
session        | walletconnect-connect-via-deeplink              | Pair with a dapp via a WalletConnect deeplink… | high     | yes       | yes      | pr-unit      | existing-unit
session        | walletconnect-connect-via-qr                    | Pair with a dapp by scanning a WalletConnect … | high     | no        | no       | manual-only  | testlio      
session        | walletconnect-disconnect-on-account-removal     | Removing an account disconnects only its Wall… | high     | yes       | yes      | pr-unit      | existing-unit
session        | walletconnect-manage-and-disconnect-sessions    | Connected apps are listed and can be disconne… | medium   | no        | yes      | none         | testlio      
session        | walletconnect-request-namespace-authorization   | Incoming requests from an address outside the… | urgent   | yes       | yes      | pr-unit      | existing-unit
session        | walletconnect-restore-sessions-on-launch        | Active sessions are restored on launch; expir… | high     | yes       | yes      | pr-unit      | existing-unit
session        | walletconnect-session-proposal-permissions      | Session-proposal sheet shows dapp identity an… | high     | no        | yes      | none         | testlio      
session        | walletconnect-siwe-authenticate                 | Sign-In With Ethereum (EIP-4361) authenticati… | high     | yes       | yes      | pr-unit      | existing-unit

Total 23  ·  automated 16  ·  feasible-but-not-automated 6  ·  not feasible 1

Functionality  | Total | Automated | Feasible gap
---------------+-------+-----------+-------------
extension-dapp | 9     | 6         | 3           
requests       | 6     | 5         | 1           
session        | 8     | 5         | 2           

```
