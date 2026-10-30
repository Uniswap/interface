# Onboarding coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area onboarding`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                            | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
--------------+-----------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
create        | onboarding-backup-recovery-phrase             | Back up and verify the recovery phrase during… | urgent   | no        | yes      | none               | uniswap      
create        | onboarding-create-new-wallet-extension        | Create a fresh wallet on the extension (GA on… | urgent   | no        | yes      | none               | testlio      
create        | onboarding-create-new-wallet-mobile           | Create a fresh wallet on mobile completes to … | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
create        | onboarding-derivation-index                   | getNextDerivationIndex picks the correct next… | high     | yes       | yes      | pr-unit            | existing-unit
create        | onboarding-extension-biometric-setup          | Enable or skip biometric unlock during extens… | high     | no        | yes      | none               | uniswap      
create        | onboarding-extension-password-create          | Set an unlock password during extension walle… | high     | no        | yes      | none               | uniswap      
create        | onboarding-face-id-setup                      | Enable biometric (Face ID) unlock during onbo… | high     | no        | yes      | none               | testlio      
create        | onboarding-notifications-prompt               | Enable, disable, or skip notifications during… | medium   | no        | yes      | none               | testlio      
create        | onboarding-skip-unitag-claim                  | Skip the unitag claim step during onboarding   | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
import        | onboarding-extension-keyboard-key             | KeyboardKey renders key states and platform-c… | low      | yes       | yes      | pr-unit            | existing-unit
import        | onboarding-import-existing-wallet-extension   | Import an existing wallet during extension on… | high     | yes       | yes      | pr-e2e             | testlio      
import        | onboarding-import-incorrect-seed-phrase       | Importing with an incorrect recovery phrase i… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
import        | onboarding-import-multiple-accounts           | Import a wallet with multiple derived account… | high     | no        | yes      | none               | testlio      
import        | onboarding-import-seed-phrase-mobile          | Import an already-created wallet via recovery… | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
import        | onboarding-import-short-seed-phrase           | Importing a phrase shorter than 12 words is b… | medium   | no        | yes      | none               | testlio      
import        | onboarding-import-view-only-ens               | Import a view-only account by address or ENS … | high     | no        | yes      | none               | testlio      
import        | onboarding-passkey-import-extension           | Import a wallet using a passkey during extens… | medium   | no        | yes      | none               | uniswap      
import        | onboarding-restore-google-drive-android       | Restore an already-created wallet from Google… | high     | no        | yes      | none               | testlio      
import        | onboarding-restore-icloud-ios                 | Restore an already-created wallet from an iCl… | high     | no        | yes      | none               | testlio      
import        | onboarding-scan-qr-sync-extension             | Onboard the extension by scanning a QR code f… | medium   | no        | yes      | none               | testlio      
import        | onboarding-select-accounts-hook               | useSelectAccounts manages import selection an… | medium   | yes       | yes      | pr-unit            | existing-unit
recovery      | onboarding-clean-install-intro                | Clean install shows the first-run intro and e… | medium   | yes       | yes      | pr-e2e             | testlio      
recovery      | onboarding-forgot-password-extension          | Forgot-password reset flow on the extension    | urgent   | no        | yes      | none               | testlio      
recovery      | onboarding-recovery-single-mnemonic-nonfunded | Single-mnemonic recovery of a non-funded wall… | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
recovery      | onboarding-remove-wallet                      | Remove a wallet (delete seed phrase and priva… | urgent   | yes       | yes      | scheduled-playwri… | existing-e2e 
recovery      | onboarding-restore-missing-seed               | Recover a missing seed phrase and view privat… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 

Total 26  ·  automated 12  ·  feasible-but-not-automated 14  ·  not feasible 0

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
create        | 9     | 3         | 6           
import        | 12    | 5         | 7           
recovery      | 5     | 4         | 1           

```
