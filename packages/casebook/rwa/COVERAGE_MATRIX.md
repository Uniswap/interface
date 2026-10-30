# RWA coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area rwa`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                           | Title                                          | Priority | Automated | Feasible | CI execution | Source       
--------------+----------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------+--------------
compliance    | rwa-geogating-swap-blocked-restricted-region | Geogated RWA assets cannot be swapped from a … | urgent   | no        | yes      | none         | uniswap      
compliance    | rwa-permissioned-send-blocking               | Sending a permissioned token is blocked by th… | high     | yes       | yes      | pr-unit      | existing-unit
compliance    | rwa-permissioned-swap-kyc-ux                 | Permissioned swap shows banner and Verify Ide… | high     | yes       | yes      | pr-unit      | existing-unit
compliance    | rwa-permissioned-swap-pair-gating            | Permissioned (KYC-gated) RWA pair resolves al… | high     | yes       | yes      | pr-unit      | existing-unit
compliance    | rwa-tdp-geoblocked-cta-hidden                | RWA TDP hides actionable trade CTAs for a geo… | urgent   | no        | yes      | none         | testlio      
explore       | rwa-explore-category-routing                 | Explore RWA category param and URL routing re… | medium   | yes       | yes      | pr-unit      | existing-unit
explore       | rwa-explore-expandable-issuer-rows           | Multi-issuer Stocks rows expand and route to … | medium   | no        | yes      | none         | testlio      
explore       | rwa-explore-grouped-category-resolution      | Category grouping (Stocks/ETFs issuer rows) i… | medium   | yes       | yes      | pr-unit      | existing-unit
explore       | rwa-explore-legal-disclaimer                 | Legal disclaimer shows only on Stocks and ETF… | low      | no        | yes      | none         | uniswap      
explore       | rwa-explore-stocks-shelf-and-chips           | Explore shows featured Stocks shelf and RWA c… | high     | no        | yes      | none         | testlio      
explore       | rwa-explore-stocks-table-and-filters         | Stocks table loads with chain filter, search,… | high     | no        | yes      | none         | testlio      
explore       | rwa-issuer-identity-plain-token-names        | Issuer rows and cards honor the token-categor… | medium   | yes       | yes      | pr-unit      | existing-unit
explore       | rwa-mobile-category-details-grouping         | Mobile Category Details screen groups Stocks/… | medium   | no        | yes      | none         | uniswap      
search        | rwa-search-stocks-section                    | Search groups and tags stocks via the RWA ind… | medium   | yes       | yes      | pr-unit      | existing-unit
swap-selector | rwa-is-rwa-token-identification              | RWA token identification matches the ListRwas… | medium   | yes       | yes      | pr-unit      | existing-unit
swap-selector | rwa-swap-stock-token-execute                 | Swap executes with a selected stock token and… | urgent   | no        | yes      | none         | testlio      
swap-selector | rwa-token-selector-stocks-section            | Selecting a Stocks-section token populates th… | high     | no        | yes      | none         | testlio      
swap-selector | rwa-whitelist-registry-parsing               | RWA whitelist parsing maps issuer data and pr… | medium   | yes       | yes      | pr-unit      | existing-unit
tdp           | rwa-tdp-coingecko-pricing                    | Stock assets use project (Coingecko) pricing … | medium   | no        | yes      | none         | testlio      
tdp           | rwa-tdp-header-identity                      | RWA TDP header shows ticker, issuer, and issu… | high     | no        | yes      | none         | testlio      
tdp           | rwa-tdp-more-ways-to-trade                   | "More ways to trade" lists other issuer token… | high     | no        | yes      | none         | testlio      
tdp           | rwa-tdp-off-hours-banner                     | Off-hours liquidity banner renders on the TDP… | medium   | no        | yes      | none         | testlio      
tdp           | rwa-tdp-off-hours-warning                    | isEquityMarketOffHours flags weekends, bounda… | high     | yes       | yes      | pr-unit      | existing-unit
tdp           | rwa-tdp-other-stocks-carousel                | Mobile TDP shows an "Other stocks" carousel w… | medium   | no        | yes      | none         | testlio      
tdp           | rwa-tdp-view-analytics                       | RWA TDP view logs once with resolved RWA and … | low      | yes       | yes      | pr-unit      | existing-unit

Total 25  ·  automated 11  ·  feasible-but-not-automated 14  ·  not feasible 0

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
compliance    | 5     | 3         | 2           
explore       | 8     | 3         | 5           
search        | 1     | 1         | 0           
swap-selector | 4     | 2         | 2           
tdp           | 7     | 2         | 5           

```
