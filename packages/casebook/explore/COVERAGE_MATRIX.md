# Explore coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area explore`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality    | ID                                             | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
-----------------+------------------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
explore-list     | explore-filter-by-search-term                  | Explore table filters correctly by search term | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-l2-token-visible-cross-network         | L2 token appears in Explore regardless of con… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-mobile-general-filters-favorites       | Mobile Explore sheet — browse, filter/sort, a… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-network-filter                         | Network filter updates the Explore leaderboar… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-pools-tab                              | Web Explore Pools tab lists pools and navigat… | high     | no        | yes      | none               | testlio      
explore-list     | explore-redirect-unknown-token-or-pool         | Unknown token or pool route redirects to Expl… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-row-navigates-to-tdp                   | Clicking a token row navigates to its Token D… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-time-window-toggle                     | Toggling time window refreshes leaderboard st… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-token-leaderboard-loads                | Explore token leaderboard loads with ranked t… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
explore-list     | explore-transactions-tab                       | Web Explore Transactions tab lists recent tra… | medium   | no        | yes      | none               | testlio      
multichain-toke… | explore-multichain-grouping-ui                 | Explore groups multichain tokens with a netwo… | high     | no        | yes      | none               | testlio      
multichain-toke… | explore-multichain-network-filtered-tdp        | Network-filtered Explore and search open the … | medium   | no        | yes      | none               | testlio      
multichain-toke… | explore-multichain-search-subtext              | Search shows multichain tokens with networks … | medium   | no        | yes      | none               | testlio      
multichain-toke… | explore-multichain-tdp-network-selector        | Multichain TDP shows a header network selector | high     | no        | yes      | none               | testlio      
search           | explore-multichain-trending-rankings-data      | Trending tokens resolve to one multichain opt… | medium   | yes       | yes      | pr-unit            | existing-unit
search           | explore-search-profile-view                    | Selecting a wallet search result opens the ex… | medium   | no        | yes      | none               | testlio      
search           | explore-search-recent-history                  | Recent searches are persisted and shown on re… | medium   | yes       | yes      | pr-unit            | existing-unit
search           | explore-search-token-results                   | Searching returns matching token results       | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
search           | explore-search-wallet-ens-unitag               | Wallet search resolves ENS names and unitags   | medium   | yes       | yes      | pr-unit            | existing-unit
search           | explore-search-web-enter-opens-first-result    | Pressing Enter in the web search input opens … | medium   | no        | yes      | none               | uniswap      
search           | explore-search-web-pools-tab-rows              | Web search Pools tab rows move version, fee a… | medium   | no        | yes      | none               | uniswap      
search           | explore-search-web-recent-pills                | Web search shows recent searches as a scrolla… | medium   | no        | yes      | none               | uniswap      
search           | explore-search-web-section-counts-and-view-all | Web search sections show 3 results at rest an… | medium   | no        | yes      | none               | uniswap      
search           | explore-search-web-tokens-tab-rows             | Web search Tokens tab rows show volume, price… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-mobile-category-details     | Mobile Category Details screen loads stats an… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-mobile-collections-page     | Mobile Collections page buckets categories an… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-mobile-explore-sections     | Mobile Explore orders its sections and routes… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-mobile-search               | Mobile search shows spotlit sections and cate… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-mobile-tdp                  | Mobile TDP shows collections chips, the token… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-unit-search-logic           | Spotlit search categories and category option… | medium   | yes       | yes      | pr-unit            | existing-unit
token-categories | explore-categories-unit-shared-logic           | Shared category bucketing, trending lookup an… | medium   | yes       | yes      | pr-unit            | existing-unit
token-categories | explore-categories-unit-web-explore-logic      | Explore category param, flex slot, More-dropd… | medium   | yes       | yes      | pr-unit            | existing-unit
token-categories | explore-categories-unit-web-tdp-logic          | TDP category chips and related-tokens section… | medium   | yes       | yes      | pr-unit            | existing-unit
token-categories | explore-categories-web-category-detail-page    | Web Category Detail Page lists only the categ… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-chip-row                | Web Explore category chip row follows the Sta… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-definition-cards        | Category definition cards open from chip hove… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-row-tags                | Explore table rows carry a primary category t… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-search-spotlit-sections | Web search surfaces spotlit category sections… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-solana-network          | Selecting the Solana network on Explore reset… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-table-filter-and-url    | Selecting a category filters the Explore tabl… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-tdp-chips-and-sections  | Web TDP shows category chips under the name a… | high     | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-tdp-related-tokens      | Web TDP related-tokens carousel switches by c… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-categories-web-trending-carousel       | Web Explore shows the Trending carousel in pl… | medium   | no        | yes      | none               | uniswap      
token-categories | explore-token-selector-category-filter-chips   | Token selector filter chips narrow search res… | high     | no        | yes      | none               | uniswap      
token-categories | explore-token-selector-category-filter-logic   | Token selector category chip derivation, filt… | medium   | yes       | yes      | pr-unit            | existing-unit
token-categories | explore-token-selector-category-tags           | Token selector rows show one category tag onl… | high     | no        | yes      | none               | uniswap      
token-categories | explore-token-selector-filter-no-results       | Token selector distinguishes an empty query r… | medium   | no        | yes      | none               | uniswap      
token-details    | explore-tdp-general-content                    | TDP renders full token content (chart, stats,… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
token-details    | explore-tdp-inline-swap-widget                 | Inline TDP swap widget quotes and stays isola… | high     | yes       | yes      | scheduled-playwri… | existing-e2e 
token-details    | explore-tdp-navigate-correct-tokens            | Navigating to TDP pre-selects the correct swa… | medium   | no        | yes      | none               | existing-e2e 
token-details    | explore-tdp-redirect-unknown-or-gated          | TDP redirects to Explore for unknown token or… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
token-details    | explore-tdp-responsive-layout                  | TDP renders correct heading structure on smal… | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
token-details    | explore-tdp-testnet-mainnet-modes              | TDP loads correct token data across testnet/m… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 

Total 53  ·  automated 22  ·  feasible-but-not-automated 31  ·  not feasible 0

Functionality    | Total | Automated | Feasible gap
-----------------+-------+-----------+-------------
explore-list     | 10    | 8         | 2           
multichain-toke… | 4     | 0         | 4           
search           | 10    | 4         | 6           
token-categories | 23    | 5         | 18          
token-details    | 6     | 5         | 1           

```
