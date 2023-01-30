describe('Swap token selector', () => {
  before(() => {
    cy.visit('/#/swap')
  })

  // **Action**: Search for token by pasting token address

  // **Expectation**: See token associated with that address

  // - If token is unknown, result should display “Unknown Token” with warning label
  // - If token is on the Warning list, show warning label (⚠️) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]
  // - If token is on the Blocked list, show blocked label (🚫) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]

  it('can search for token by exact address', () => {
    cy.get('#swap-currency-input .open-currency-select-button').click()
    // Type UNI token contract address.
    cy.get('[data-cy="token-search-input"]').clear().type('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('.token-item-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984').should('exist')
    cy.get('.token-item-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984').find('[data-cy="warning-icon"]').should('exist')

    // // Type Shiba Ramen token contract address.
    // cy.get('[data-cy="token-search-input"]').clear().type('0xb2e20502c7593674509b8384ed9240a03869faf3')
    // cy.get('.token-item-0xb2e20502c7593674509b8384ed9240a03869faf3').find('[data-cy="warning-icon"]').should('exist')
  })

  //   **Action**: Open swap component

  // **Expectation**: Token list should be [UL Default List](https://tokenlists.org/token-list?url=https://tokens.uniswap.org) tokens on the selected global network

  // - If global network isn’t mainnet, token logos should have network sub-logo

  // **Action**: Search for token by typing in name

  // **Expectation**: See token(s) with those characters in the name

  // - If token is on the Warning list, show warning label (⚠️) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]
  // - If token is on the Blocked list, show blocked label (🚫) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]

  // **Action**: Search for blocked token

  // **Expectation**: Token should show in results, but have a blocked badge next to it (https://uniswaplabs.atlassian.net/browse/WEB-1870)

  // **Action**: Search for a token that doesn’t exist on the global network

  // - Example: Global network is Optimism, you paste in the contract for [Ethereum USDT](https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7)

  // **Expectation**: Result should display “No token found” ([jira](https://uniswaplabs.atlassian.net/browse/WEB-2350))
})
