# Settings coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area settings`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality   | ID                                     | Title                                          | Priority | Automated | Feasible | CI execution | Source       
----------------+----------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
account-general | settings-change-nickname               | Edit wallet nickname / profile name            | medium   | no        | yes      | none         | testlio      
account-general | settings-extension-navigation          | Extension settings screen navigation           | low      | no        | yes      | none         | testlio      
account-general | settings-manage-connections            | View and revoke active dapp connections        | high     | no        | yes      | none         | testlio      
account-general | settings-mobile-navigation             | Wallet settings screen navigation and sections | low      | no        | yes      | none         | testlio      
account-general | settings-spam-token-visibility         | Hide spam / small-balance tokens setting       | medium   | yes       | yes      | pr-unit      | existing-unit
account-general | settings-storage-management            | On-device storage settings and clear-data gua… | medium   | yes       | yes      | pr-unit      | existing-unit
account-general | settings-testnet-mode                  | Testnet mode defaults off and gates the testn… | high     | yes       | yes      | pr-unit      | existing-unit
account-general | settings-view-only-account             | View-only account hides signing-gated setting… | medium   | no        | yes      | none         | uniswap      
account-general | settings-web-navigation                | Web app settings and navigation menu           | low      | no        | yes      | none         | testlio      
localization    | settings-ext-i18n-spanish              | Extension renders in a non-default language    | medium   | no        | yes      | none         | testlio      
localization    | settings-fiat-currency-switch          | Change display fiat currency across balances … | medium   | no        | yes      | none         | testlio      
localization    | settings-language-switch-mobile        | Switch app language and re-render localized s… | medium   | no        | yes      | none         | testlio      
localization    | settings-locale-decimal-input          | Locale decimal separator accepted in amount i… | high     | no        | yes      | none         | testlio      
network-gas     | settings-custom-gas-row-state          | Network-cost row reflects auto vs custom over… | high     | yes       | yes      | pr-unit      | existing-unit
network-gas     | settings-custom-gas-toggle             | Enable custom ("customize gas") network-cost … | high     | yes       | yes      | pr-unit      | existing-unit
network-gas     | settings-network-selector-options      | Network selector sorts and sections chains co… | high     | yes       | yes      | pr-unit      | existing-unit
network-gas     | settings-network-switching-mobile      | Switch active network from settings / network… | medium   | no        | yes      | none         | testlio      
security        | settings-biometric-toggle-mobile       | Toggle Face ID / biometric app lock from sett… | urgent   | no        | yes      | none         | testlio      
security        | settings-ext-biometric-unlock          | Unlock extension with a stored biometric cred… | urgent   | yes       | yes      | pr-unit      | existing-unit
security        | settings-ext-biometric-unlock-setup    | Enable biometric unlock (WebAuthn) from exten… | urgent   | yes       | yes      | pr-unit      | existing-unit
security        | settings-ext-change-password-biometric | Change extension password with biometric re-e… | urgent   | yes       | yes      | pr-unit      | existing-unit
security        | settings-ext-password-reset-flow       | Password reset state machine transitions corr… | urgent   | yes       | yes      | pr-unit      | existing-unit
security        | settings-view-recovery-phrase          | View recovery phrase behind an auth gate       | urgent   | no        | yes      | none         | testlio      

Total 23  ·  automated 10  ·  feasible-but-not-automated 13  ·  not feasible 0

Functionality   | Total | Automated | Feasible gap
----------------+-------+-----------+-------------
account-general | 9     | 3         | 6           
localization    | 4     | 0         | 4           
network-gas     | 4     | 3         | 1           
security        | 6     | 4         | 2           

```
