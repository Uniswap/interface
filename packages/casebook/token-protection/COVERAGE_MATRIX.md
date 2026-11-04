# Token Protection coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area token_protection`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                                         | Title                                          | Priority | Automated | Feasible | CI execution | Source       
-----------------+------------------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
compliance-perm… | token-protection-geogating-intl-allowed                    | Geogated asset is swappable outside the restr… | medium   | no        | no       | manual-only  | testlio      
compliance-perm… | token-protection-geogating-us-blocked                      | Geogated asset cannot be swapped from a restr… | urgent   | no        | no       | manual-only  | testlio      
compliance-perm… | token-protection-permissioned-send-blocked                 | Sending a permissioned token to a non-allowli… | urgent   | yes       | yes      | pr-unit      | existing-unit
compliance-perm… | token-protection-permissioned-swap-blocked-not-allowlisted | Permissioned swap is blocked until the wallet… | urgent   | yes       | yes      | pr-unit      | existing-unit
compliance-perm… | token-protection-permissioned-token-kyc-banner             | Permissioned token shows a verify-identity ba… | high     | yes       | yes      | pr-unit      | existing-unit
compliance-perm… | token-protection-sanctioned-address-screening              | Sanctioned active address is screened and blo… | urgent   | yes       | yes      | pr-unit      | existing-unit
compliance-perm… | token-protection-token-kyc-status-unit                     | Token KYC status resolution fails open and th… | high     | yes       | yes      | pr-unit      | existing-unit
fee-warnings     | token-protection-fot-high-fee-warning                      | High fee-on-transfer token (>=15%) shows a hi… | high     | no        | no       | manual-only  | testlio      
fee-warnings     | token-protection-fot-low-fee-warning                       | Low fee-on-transfer token shows a medium "fee… | medium   | no        | no       | manual-only  | testlio      
fee-warnings     | token-protection-fot-very-high-fee-warning                 | Very high fee-on-transfer token (>=80%) is fl… | high     | yes       | yes      | pr-unit      | existing-unit
fee-warnings     | token-protection-honeypot-100-fee                          | Honeypot token (100% sell fee) is flagged mal… | urgent   | no        | no       | manual-only  | testlio      
fee-warnings     | token-protection-potential-honeypot-warning                | Potential-honeypot attack type shows a medium… | high     | yes       | yes      | pr-unit      | existing-unit
fee-warnings     | token-protection-warning-copy-unit                         | Warning modal and card copy render correctly … | medium   | yes       | yes      | pr-unit      | existing-unit
malicious-block… | token-protection-blocked-token-buy-disabled                | Blocked token TDP shows unavailable message w… | high     | no        | no       | manual-only  | testlio      
malicious-block… | token-protection-blocked-token-swap-disabled               | Blocked token produces a blocking swap warning | urgent   | yes       | yes      | pr-unit      | testlio      
malicious-block… | token-protection-low-nondefault-do-your-research           | Non-default (low) token shows "always do your… | medium   | no        | no       | manual-only  | testlio      
malicious-block… | token-protection-low-warning-dismissal-persists            | "Don't show me this warning again" suppresses… | medium   | no        | no       | manual-only  | testlio      
malicious-block… | token-protection-malicious-general-review-ack              | Malicious token swap requires explicit "I und… | urgent   | no        | no       | manual-only  | testlio      
malicious-block… | token-protection-malicious-impersonator-warning            | Malicious impersonator token shows a high-sev… | high     | no        | no       | manual-only  | testlio      
malicious-block… | token-protection-severity-mapping-unit                     | Warning-severity mapping is correct across al… | high     | yes       | yes      | pr-unit      | existing-unit
malicious-block… | token-protection-spam-airdrop-warning                      | Spam airdrop token shows a medium warning      | low      | yes       | yes      | pr-unit      | existing-unit

Total 21  ·  automated 11  ·  feasible-but-not-automated 0  ·  not feasible 10

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
compliance-perm… | 7     | 5         | 0           
fee-warnings     | 6     | 3         | 0           
malicious-block… | 8     | 3         | 0           

```
