# Portfolio coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area portfolio`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                      | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
-----------------+-----------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
accounts         | portfolio-account-list-data             | Account list data returns per-address balance… | medium   | yes       | yes      | pr-unit            | existing-unit
accounts         | portfolio-account-switcher              | Account switcher lists accounts and switches … | high     | yes       | yes      | pr-unit            | existing-unit
accounts         | portfolio-add-remove-account            | Adding and removing accounts updates wallet s… | high     | yes       | yes      | pr-unit            | existing-unit
accounts         | portfolio-copy-own-address              | Copy own account address for the first time    | medium   | no        | yes      | none               | testlio      
accounts         | portfolio-copy-token-contract-address   | Copy token contract address shows the do-not-… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
accounts         | portfolio-get-token-cta                 | Empty wallet shows a Get token / Receive CTA   | medium   | no        | yes      | none               | testlio      
home-portfolio   | portfolio-data-liveliness               | Data liveliness surfaces stale/unavailable ba… | medium   | no        | yes      | none               | testlio      
home-portfolio   | portfolio-demo-view                     | Demo portfolio view renders for a disconnecte… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-external-and-view-only-wallet | External / view-only wallet portfolio renders… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-home-funded-token-list        | Token table lists visible balances in descend… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-home-zero-balance             | Home shows $0.00 and empty state for a wallet… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-multichain-expansion-rows     | Multichain balance list builds parent/hidden/… | medium   | yes       | yes      | pr-unit            | existing-unit
home-portfolio   | portfolio-multichain-metrics            | Multichain portfolio metrics aggregate per-ch… | low      | yes       | yes      | pr-unit            | existing-unit
home-portfolio   | portfolio-multichain-token-ux           | Multichain token UX groups same-token balance… | high     | no        | yes      | none               | testlio      
home-portfolio   | portfolio-network-filter                | Network filter scopes portfolio data and pers… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-overview-value-and-chart      | Portfolio overview displays total value and t… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-tab-navigation                | Portfolio header tabs navigate between Overvi… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
home-portfolio   | portfolio-token-row-to-tdp              | Tapping a token row opens its token details p… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
pnl-and-chart    | portfolio-balance-diff-within-range     | Balance-diff tolerance flags chart/portfolio … | medium   | yes       | yes      | pr-unit            | existing-unit
pnl-and-chart    | portfolio-chart-mobile-happy-path       | Mobile portfolio chart expands, switches time… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
pnl-and-chart    | portfolio-chart-percent-change          | Chart percent change uses first and last valu… | medium   | yes       | yes      | pr-unit            | existing-unit
pnl-and-chart    | portfolio-pnl-metrics                   | Profit & Loss / performance metrics display f… | high     | yes       | yes      | pr-unit            | testlio      
pnl-and-chart    | portfolio-relative-change-unavailable   | Relative change shows an unavailable indicato… | medium   | yes       | yes      | pr-unit            | existing-unit
token-visibility | portfolio-hidden-nfts-tab               | Hidden NFTs stay out of the main grid on the … | low      | no        | no       | manual-only        | testlio      
token-visibility | portfolio-hidden-tokens-expando         | Hidden-tokens section stays collapsed by defa… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
token-visibility | portfolio-hide-unhide-token             | Hide and unhide a token moves it in/out of th… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
token-visibility | portfolio-token-row-context-menu        | Token row long-press / hover exposes a contex… | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
token-visibility | portfolio-token-search                  | Token search filters the portfolio token list… | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
token-visibility | portfolio-visibility-slice              | Visibility slice toggles token / NFT / activi… | medium   | yes       | yes      | pr-unit            | existing-unit

Total 29  ·  automated 24  ·  feasible-but-not-automated 4  ·  not feasible 1

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
accounts         | 6     | 4         | 2           
home-portfolio   | 12    | 10        | 2           
pnl-and-chart    | 5     | 5         | 0           
token-visibility | 6     | 5         | 0           

```
