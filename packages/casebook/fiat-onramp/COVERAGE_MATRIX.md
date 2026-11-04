# Fiat Onramp coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area fiat_onramp`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                                     | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
--------------+--------------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
cex-transfer  | fiat-onramp-cex-transfer-empty-wallet                  | CEX transfer into an empty wallet updates bal… | high     | no        | no       | manual-only        | testlio      
cex-transfer  | fiat-onramp-cex-transfer-funded-wallet                 | CEX transfer into a funded wallet reflects in… | high     | no        | no       | manual-only        | testlio      
offramp       | fiat-onramp-offramp-confirm-transfer-web               | Web off-ramp confirm-transfer builds and send… | urgent   | no        | yes      | none               | uniswap      
offramp       | fiat-onramp-offramp-general-sell-tab                   | Sell tab presets, min-amount validation and q… | high     | no        | yes      | none               | testlio      
offramp       | fiat-onramp-offramp-instructions                       | FOR / Fiat Off Ramp instructions and help sur… | low      | no        | yes      | none               | testlio      
offramp       | fiat-onramp-offramp-provider-moonpay-send-with-uniswap | Off-ramp sell via Moonpay confirms an on-chai… | urgent   | no        | no       | manual-only        | testlio      
offramp       | fiat-onramp-offramp-provider-robinhood                 | Off-ramp sell via Robinhood submits a send an… | urgent   | no        | no       | manual-only        | testlio      
offramp       | fiat-onramp-offramp-provider-transak                   | Off-ramp sell via Transak submits a send and … | urgent   | no        | no       | manual-only        | testlio      
offramp       | fiat-onramp-offramp-unsupported-token-modal            | Selecting an unsupported sell token offers "S… | medium   | no        | yes      | none               | uniswap      
onramp        | fiat-onramp-change-country                             | Changing buy country refreshes supported prov… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
onramp        | fiat-onramp-change-input-token                         | Changing the buy input token preserves amount… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
onramp        | fiat-onramp-decimal-pad-caret-position                 | Buy amount decimal pad caret stays correctly … | medium   | no        | yes      | none               | uniswap      
onramp        | fiat-onramp-deeplink-mobile                            | fiatonramp deeplink opens the Buy flow prefil… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
onramp        | fiat-onramp-embedded-wallet-buy                        | Embedded-wallet user completes the buy form t… | high     | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-extension-buy-routing                      | Extension Buy button opens web /buy with the … | medium   | no        | yes      | none               | uniswap      
onramp        | fiat-onramp-get-token-cta-buy-with-card                | Get-token CTA on TDP offers "Buy with Card" w… | medium   | no        | yes      | none               | testlio      
onramp        | fiat-onramp-moonpay-deeplink-web                       | Buy deeplink with chain param prompts connect… | high     | no        | yes      | none               | testlio      
onramp        | fiat-onramp-provider-coinbase                          | On-ramp purchase via Coinbase updates USDC ba… | urgent   | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-provider-robinhood                         | On-ramp purchase via Robinhood updates ETH ba… | urgent   | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-provider-stripe-kyc                        | On-ramp purchase via Stripe including KYC com… | high     | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-provider-transak                           | On-ramp purchase via Transak updates MATIC/PO… | high     | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-quick-amount-select                        | Buy form quick-amount preset builds a quote a… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
onramp        | fiat-onramp-redirect-url-not-claimed-by-native         | On-ramp return path resolves correctly and is… | high     | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-return-preserves-provider-query            | Returning from a provider forwards to /buy wi… | high     | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-submit-order-moonpay                       | Submit an on-ramp order to Moonpay and track … | urgent   | no        | no       | manual-only        | testlio      
onramp        | fiat-onramp-unit-country-from-locale                   | getCountryFromLocale derives the buy/sell cou… | medium   | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-country-list-and-predefined-amount    | Country list modal and predefined-amount pres… | low      | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-for-transaction-polling               | FOR transaction polling updates, keeps or rem… | high     | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-iso-currency-validation               | isValidIsoCurrencyCode and FOR utils validate… | medium   | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-payment-method-filter                 | PaymentMethodFilter renders and reflects sele… | medium   | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-provider-connected-and-error-views    | Provider connected and connection-error views… | medium   | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-unit-quote-filtering-and-sections          | FOR quote filtering, sectioning and amount-er… | medium   | yes       | yes      | pr-unit            | existing-unit
onramp        | fiat-onramp-user-input-amount                          | Buy form accepts a typed fiat amount and adva… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 

Total 33  ·  automated 14  ·  feasible-but-not-automated 8  ·  not feasible 11

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
cex-transfer  | 2     | 0         | 0           
offramp       | 7     | 0         | 4           
onramp        | 24    | 14        | 4           

```
