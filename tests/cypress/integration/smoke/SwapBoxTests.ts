import { SwapPage } from '../../../pages/SwapPage'
import { TokenPicker } from '../../../pages/TokenPicker'

describe('Menu bar tests', () => {
  beforeEach(() => {
    SwapPage.visitSwapPage()
  })
  it('Should display swap box with 2 inputs and 2 currency selectors', () => {
    SwapPage.getSwapBox().should('be.visible')
    SwapPage.getCurrencySelectors().should('have.length', 2)
    SwapPage.getToInput().should('be.visible')
    SwapPage.getFromInput().should('be.visible')
  })
  it('Should display token menu after clicking select token', () => {
    SwapPage.openTokenToSwapMenu()
    TokenPicker.getPicker().should('be.visible')
  })
  it('Should pick only eth as default from value', () => {
    SwapPage.getCurrencySelectors()
      .first()
      .should('contain.text', 'ETH')
    SwapPage.getCurrencySelectors()
      .last()
      .should('contain.text', 'select Token')
  })
  it('Should type in numbers into from input', () => {
    SwapPage.typeValueIn('100.323')
    SwapPage.getFromInput().should('contain.value', '100.323')
  })
  it('Should not allow to type not numbers into from input', () => {
    SwapPage.typeValueIn('!#$%^&*(*)_qewruip')
    SwapPage.getFromInput().should('contain.value', '')
  })
  it('Should type in numbers into from input', () => {
    SwapPage.typeValueTo('100.323')
    SwapPage.getToInput().should('contain.value', '100.323')
  })
  it('Should not allow to type not numbers into from input', () => {
    SwapPage.typeValueTo('!#$%^&*(*)_qewruip')
    SwapPage.getToInput().should('contain.value', '')
  })
})
