import { ChainId, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { nativeOnChain, UNI } from 'constants/tokens'

import { getBalance } from '../../utils'
import { aliasQuery } from '../../utils/graphql-test-utils'

const UNI_MAINNET = UNI[ChainId.MAINNET]
const ETH_MAINNET = nativeOnChain(1) as Token

describe('Add Liquidity', () => {
  beforeEach(() => {
    cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req) => {
      aliasQuery(req, 'feeTierDistribution')
    })
  })

  it('loads the token pair', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH/500')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'ETH')
    cy.contains('0.05% fee tier')
  })

  it('does not crash if token is duplicated', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
    cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'UNI')
  })

  it('single token can be selected', () => {
    cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
    cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'UNI')
  })

  it('loads fee tier distribution', () => {
    cy.fixture('feeTierDistribution.json').then((feeTierDistribution) => {
      cy.intercept('POST', '/subgraphs/name/uniswap/uniswap-v3', (req: CyHttpMessages.IncomingHttpRequest) => {
        if (hasQuery(req, 'FeeTierDistribution')) {
          req.alias = 'FeeTierDistribution'

          req.reply({
            body: {
              data: {
                ...feeTierDistribution,
              },
            },
            headers: {
              'access-control-allow-origin': '*',
            },
          })
        }
      })

      cy.visit('/add/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/ETH')
      cy.wait('@FeeTierDistribution')
      cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
      cy.get('#add-liquidity-selected-fee .selected-fee-percentage').should('contain.text', '40% select')
    })
  })

  it('disables increment and decrement until initial prices are inputted', () => {
    // ETH / BITCOIN pool (0.05% tier not created)
    cy.visit('/add/ETH/0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9/500')
    // Set starting price in order to enable price range step counters
    cy.get('.start-price-input').type('1000')

    // Min Price increment / decrement buttons should be disabled
    cy.get('[data-testid="increment-price-range"]').eq(0).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(0).should('be.disabled')
    // Enter min price, which should enable the buttons
    cy.get('.rate-input-0').eq(0).type('900').blur()
    cy.get('[data-testid="increment-price-range"]').eq(0).should('not.be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(0).should('not.be.disabled')

    // Repeat for Max Price step counter
    cy.get('[data-testid="increment-price-range"]').eq(1).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(1).should('be.disabled')
    // Enter max price, which should enable the buttons
    cy.get('.rate-input-0').eq(1).type('1100').blur()
    cy.get('[data-testid="increment-price-range"]').eq(1).should('not.be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(1).should('not.be.disabled')
  })

  it('allows full range selection on new pool creation', () => {
    // ETH / BITCOIN pool (0.05% tier not created)
    cy.visit('/add/ETH/0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9/500')
    // Set starting price in order to enable price range step counters
    cy.get('.start-price-input').type('1000')
    cy.get('[data-testid="set-full-range"]').click()
    // Check that the min price is 0 and the max price is infinity
    cy.get('.rate-input-0').eq(0).should('have.value', '0')
    cy.get('.rate-input-0').eq(1).should('have.value', '∞')
    // Increment and decrement buttons are disabled when full range is selected
    cy.get('[data-testid="increment-price-range"]').eq(0).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(0).should('be.disabled')
    cy.get('[data-testid="increment-price-range"]').eq(1).should('be.disabled')
    cy.get('[data-testid="decrement-price-range"]').eq(1).should('be.disabled')
    // Check that url params were added
    cy.url().then((url) => {
      const params = new URLSearchParams(url)
      const minPrice = params.get('minPrice')
      const maxPrice = params.get('maxPrice')
      // Note: although 0 and ∞ displayed, actual values in query are ticks at limit
      return minPrice && maxPrice && parseFloat(minPrice) < parseFloat(maxPrice)
    })
  })

  it('creates ETH-UNI position', () => {
    // Setup: fund wallet with 1000 UNI
    cy.hardhat().then((hardhat) => hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(UNI_MAINNET, 1000e18)))
    // Go to Add Liquidity page
    cy.visit('/add')
    // Select pair of currencies (ETH and UNI)
    cy.get('.open-currency-select-button').eq(0).click()
    cy.get('#token-search-input').type('ETH')
    cy.get('[class*="token-item-"]').eq(0).should('contain', 'ETH').click()
    cy.get('.open-currency-select-button').eq(1).click()
    cy.get('#token-search-input').type('UNI')
    cy.get('[class*="token-item-"]').eq(0).should('contain', 'UNI').click()
    // Verify that largest fee tier automatically recommended
    cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
    // Verify that suggested price range is automatically populated
    cy.get('.rate-input-0').eq(0).invoke('val').should('be.ok')
    cy.get('.rate-input-0').eq(1).invoke('val').should('not.be.empty')
    // Verify that ETH balance is correct
    cy.hardhat().then(async (hardhat) => {
      const ethBalance = Number(await hardhat.wallet.getBalance()) / 10 ** 18
      cy.get('#add-liquidity-input-tokena .token-amount-input').contains(ethBalance.toLocaleString())
    })
    // Verify that UNI balance is correct
    getBalance(UNI_MAINNET).then((balance) => {
      cy.get('#add-liquidity-input-tokenb .token-amount-input').contains(balance.toLocaleString())
    })
    // Enter amount of 1 ETH to be deposited
    cy.get('#add-liquidity-input-tokena .token-amount-input').type('1').should('have.value', '1')
    // Approve UNI token
    cy.contains('Approve UNI').click()
    cy.hardhat().then((hardhat) => {
      hardhat.approval.setTokenAllowanceForPermit2({ owner: hardhat.wallet, token: UNI_MAINNET })
      hardhat.approval.setPermit2Allowance({ owner: hardhat.wallet, token: UNI_MAINNET })
    })
    cy.contains('Approving').should('not.exist')
    // Preview liquidity provision
    cy.contains('Preview').click()
    // Confirm
    cy.contains('button', 'Add').click()
    // cy.wait('@eth_getTransactionReceipt')
    // Close and redirect to Pools page
    cy.contains('Close').click()
    // Verify that pool has been created
  })

  // it('creates ETH-UNI position', () => {
  //   // Setup: fund wallet with 1000 UNI
  //   cy.hardhat().then((hardhat) => hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(UNI_MAINNET, 1000e18)))
  //   cy.visit('/add')
  //   cy.get(getTestSelector('uniswap-wallet-banner')).click()
  //   selectsPair(ETH_MAINNET, UNI_MAINNET)
  //   // Verify that largest fee tier automatically recommended
  //   cy.get('#add-liquidity-selected-fee .selected-fee-label').should('contain.text', '0.3% fee tier')
  //   // Verify that suggested price range is automatically populated
  //   cy.get('.rate-input-0').eq(0).invoke('val').should('be.ok')
  //   cy.get('.rate-input-0').eq(1).invoke('val').should('not.be.empty')
  //   // Verify that call to action message is correct
  //   cy.contains('Enter an amount')
  //   // Verify that ETH balance is correct
  //   cy.hardhat().then(async (hardhat) => {
  //     const ethBalance = Number(await hardhat.wallet.getBalance()) / 10 ** UNI_MAINNET.decimals
  //     cy.contains('Balance: ' + ethBalance.toLocaleString())
  //   })
  //   // Verify that UNI balance is correct
  //   getBalance(UNI_MAINNET).then((uniBalance) => {
  //     cy.contains('Balance: ' + uniBalance.toLocaleString())
  //   })
  //   depositsToken(true, 1)
  //   // Approve button is present and enabled for UNI
  //   cy.contains(`Approve ${UNI_MAINNET.symbol}`).should('be.enabled')
  //   // Preview button is visible but disabled
  //   cy.contains('Preview').should('be.disabled')
  //   approvesToken(UNI_MAINNET)
  //   clicksPreview()
  //   clicksAdd()
  //   // Verify confirmation popup
  //   cy.contains('Added liquidity')
  //   // Verify that pool has been created
  //   cy.hardhat().then(async ({ wallet, pool }) => {
  //     // Get the newest position owned by this address
  //     const tokenIds = await pool.getPositionIds(wallet.address)
  //     const latestPositionId = tokenIds[tokenIds.length - 1]
  //     const latestPosition = await pool.getPositionInfo(latestPoolTokenId)

  //     // Verify that the tokens are correct
  //     cy.wrap(latestPoolInfo.token0).should('eq', UNI_MAINNET.address)
  //     cy.wrap(latestPoolInfo.token1).should('eq', ETH_MAINNET.wrapped.address)
  //     console.log(latestPoolInfo)
  //     // Verify that the fee tier is correct

  //     // Verify that the price range is correct
  //     const tickUpperPrice = tickToPrice(ETH_MAINNET.wrapped, UNI_MAINNET, latestPoolInfo.tickUpper).toSignificant(8)
  //     const tickLowerPrice = tickToPrice(ETH_MAINNET.wrapped, UNI_MAINNET, latestPoolInfo.tickLower).toSignificant(8)
  //     cy.get('.rate-input-0').eq(0).invoke('val').then((price) => price === tickUpperPrice)
  //     cy.get('.rate-input-0').eq(1).invoke('val').then((price) => price === tickLowerPrice)
  //     // Verify that the deposit amounts are correct
  //     console.log(latestPoolInfo.tokensOwed1.toString())
  //     NonfungiblePositionManager.removeCallParameters()
  //     Position.
  //   })
  //   closesModal()
  //   // Verify redirection
  //   cy.url().should('include', '/pools')
  // })
})
