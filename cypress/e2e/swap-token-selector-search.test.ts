describe('Swap', () => {
  before(() => {
    cy.visit('/swap')
  })

  it.skip('can swap ETH for DAI', () => {
    cy.get('#swap-currency-input .open-currency-select-button').click()
    cy.get('.token-item-0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735').click()
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.0000001')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
    cy.get('#swap-button').click()
    cy.get('#confirm-swap-or-send').should('contain', 'Confirm Swap')
    cy.get('[data-cy="confirmation-close-icon"]').click()
  })

  //   **Action**: Open swap component

  // **Expectation**: Token list should be [UL Default List](https://tokenlists.org/token-list?url=https://tokens.uniswap.org) tokens on the selected global network

  // - If global network isn’t mainnet, token logos should have network sub-logo

  // **Action**: Search for token by typing in name

  // **Expectation**: See token(s) with those characters in the name

  // - If token is on the Warning list, show warning label (⚠️) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]
  // - If token is on the Blocked list, show blocked label (🚫) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]

  // **Action**: Search for token by pasting token address

  // **Expectation**: See token associated with that address

  // - If token is unknown, result should display “Unknown Token” with warning label
  // - If token is on the Warning list, show warning label (⚠️) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]
  // - If token is on the Blocked list, show blocked label (🚫) next to it [[spec](https://www.notion.so/Token-Warnings-spec-Web-Mobile-3f7fce6f93694be08a94a6984d50298e)]

  // **Action**: Search for blocked token

  // **Expectation**: Token should show in results, but have a blocked badge next to it (https://uniswaplabs.atlassian.net/browse/WEB-1870)

  // **Action**: Search for a token that doesn’t exist on the global network

  // - Example: Global network is Optimism, you paste in the contract for [Ethereum USDT](https://etherscan.io/address/0xdac17f958d2ee523a2206206994597c13d831ec7)

  // **Expectation**: Result should display “No token found” ([jira](https://uniswaplabs.atlassian.net/browse/WEB-2350))
})
