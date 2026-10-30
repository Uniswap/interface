# NFT coverage matrix

_Generated — do not edit. Run `bun scripts/casebook.ts --generate-docs --area nft`._

Covered = a documented case exists. Automated = linked to an in-repo test.
Feasible = can be automated (no = manual / Testlio only).

```text
Functionality | ID                                   | Title                                          | Priority | Automated | Feasible | CI execution       | Source       
--------------+--------------------------------------+------------------------------------------------+----------+-----------+----------+--------------------+--------------
context-menu  | nft-context-menu-extension           | NFT context menu shows the full owned-asset a… | medium   | no        | yes      | none               | testlio      
context-menu  | nft-context-menu-mobile-longpress    | Long-press NFT surfaces the context menu (mob… | medium   | no        | yes      | none               | testlio      
context-menu  | nft-external-links                   | NFT external-link and copy-address actions op… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
context-menu  | nft-hide-unhide-extension            | Hide then unhide an NFT via context menu (ext… | medium   | no        | yes      | none               | testlio      
context-menu  | nft-report-spam-mobile               | Report an NFT as spam hides it and confirms w… | high     | no        | yes      | none               | testlio      
hidden        | nft-hidden-expando-mobile            | Hidden NFTs expando row toggles hidden group … | medium   | no        | yes      | none               | uniswap      
hidden        | nft-hidden-expando-web               | Hidden NFTs expand below the expando row with… | medium   | no        | yes      | none               | testlio      
hidden        | nft-hidden-exploratory-web           | Hidden NFTs focus exploratory pass (web)       | low      | no        | no       | manual-only        | testlio      
hidden        | nft-hidden-grouping                  | NFTs group into shown vs hidden with spam hid… | medium   | no        | yes      | none               | uniswap      
mint-purchase | nft-mint-zora-mobile                 | Mint an NFT on Zora and confirm the on-chain … | urgent   | no        | no       | manual-only        | testlio      
mint-purchase | nft-purchase-avax-mobile             | Purchase an NFT on Avalanche via external dap… | urgent   | no        | no       | manual-only        | testlio      
view          | nft-demo-view-web                    | Disconnected demo view shows NFT content and … | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-empty-state-web                  | NFT empty states — no NFTs, chain-filtered, a… | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-external-wallet-view-web         | NFTs render for an external / view-only walle… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-filter-unit                      | filterNft matches name, collection, token id,… | medium   | yes       | yes      | pr-unit            | existing-unit
view          | nft-grid-display-web                 | Portfolio NFT grid renders cards, collection … | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-open-external-marketplace-mobile | Tapping an NFT opens it on the external marke… | medium   | no        | yes      | none               | testlio      
view          | nft-responsive-web                   | NFT grid and search render correctly on mobil… | low      | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-search-filter-web                | NFT search filters by name and collection wit… | medium   | yes       | yes      | scheduled-playwri… | existing-e2e 
view          | nft-search-hook-unit                 | useNftSearch partitions shown/hidden NFTs by … | medium   | yes       | yes      | pr-unit            | existing-unit
view          | nft-view-tab-extension               | NFT tab displays owned NFTs (extension)        | medium   | no        | yes      | none               | testlio      
view          | nft-view-tab-mobile                  | NFT tab displays all owned NFTs (mobile)       | medium   | no        | yes      | none               | testlio      

Total 22  ·  automated 9  ·  feasible-but-not-automated 10  ·  not feasible 3

Functionality | Total | Automated | Feasible gap
--------------+-------+-----------+-------------
context-menu  | 5     | 1         | 4           
hidden        | 4     | 0         | 3           
mint-purchase | 2     | 0         | 0           
view          | 11    | 8         | 3           

```
