import { SWAP_ROUTER_ADDRESSES } from '../../src/constants/addresses'
import { SupportedChainId } from '../../src/constants/chains'
import { getSwapRouterHandler } from '../utils/ethbridge/abihandlers/SwapRouter'
import { CustomizedBridge } from '../utils/ethbridge/CustomizedBridge'

describe('Swap', () => {
  const WETH = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
  const DAI = '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'

  beforeEach(() => {
    cy.visit('/swap')
  })

  it('starts with ETH selected by default', () => {
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    cy.get('#swap-currency-input .token-symbol-container').should('contain.text', 'ETH')
    cy.get('#swap-currency-output .token-amount-input').should('not.have.value')
    cy.get('#swap-currency-output .token-symbol-container').should('contain.text', 'Select a token')
  })

  it('can enter an amount into input', () => {
    cy.get('#swap-currency-input .token-amount-input')
      .clear()
      .type('0.001', { delay: 200 })
      .should('have.value', '0.001')
  })

  it('zero swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.0', { delay: 200 }).should('have.value', '0.0')
  })

  it('invalid swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('\\', { delay: 200 }).should('have.value', '')
  })

  it('can enter an amount into output', () => {
    cy.get('#swap-currency-output .token-amount-input').type('0.001', { delay: 200 }).should('have.value', '0.001')
  })

  it('zero output amount', () => {
    cy.get('#swap-currency-output .token-amount-input').type('0.0', { delay: 200 }).should('have.value', '0.0')
  })

  it('can swap ETH for DAI', () => {
    const swapHandler = getSwapRouterHandler()
    cy.window().then((win) => {
      // @ts-ignore
      const bridge = win.ethereum as CustomizedBridge
      cy.spy(swapHandler, 'swapSpy')
      bridge.setHandler(SWAP_ROUTER_ADDRESSES[SupportedChainId.RINKEBY], swapHandler)
    })
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get(`.token-item-${DAI}`).should('be.visible')
    cy.get(`.token-item-${DAI}`).click({ force: true })
    cy.get('#swap-currency-input .token-amount-input').should('be.visible')
    cy.get('#swap-currency-input .token-amount-input').type('0.001', { force: true, delay: 200 })
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
    cy.get('#swap-button').click()
    cy.get('#confirm-swap-or-send').click()
    cy.get('[data-testid=transaction-submitted-content]')
      .should('exist')
      .then(() => {
        expect(swapHandler.swapSpy).to.have.calledWith({
          tokenId: WETH,
          tokenOut: DAI,
          amountIn: '1000000000000000',
        })
      })
  })

  it.skip('add a recipient does not exist unless in expert mode', () => {
    cy.get('#add-recipient-button').should('not.exist')
  })

  describe('expert mode', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('confirm')
      })
      cy.get('#open-settings-dialog-button').click()
      cy.get('#toggle-expert-mode-button').click()
      cy.get('#confirm-expert-mode').click()
    })

    it.skip('add a recipient is visible', () => {
      cy.get('#add-recipient-button').should('be.visible')
    })

    it.skip('add a recipient', () => {
      cy.get('#add-recipient-button').click()
      cy.get('#recipient').should('exist')
    })

    it.skip('remove recipient', () => {
      cy.get('#add-recipient-button').click()
      cy.get('#remove-recipient-button').click()
      cy.get('#recipient').should('not.exist')
    })
  })
})
