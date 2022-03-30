import 'cypress-localstorage-commands'
import { TransactionHelper } from '../../utils/TransactionHelper'
import { MenuBar } from '../../pages/MenuBar'
import { SwapPage } from '../../pages/SwapPage'
import { AddressesEnum } from '../../utils/AddressesEnum'

describe('SWAP', () => {
  const TRANSACTION_VALUE: number = 0.000000001

  let balanceBefore: {
    message: string
    result: string
    status: string
  }

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
    MenuBar.connectWallet()
    TransactionHelper.checkTokenBalance(AddressesEnum.WETH_TOKEN).then(balance => {
      console.log('Balance before test:', balance)
      balanceBefore = balance
    })
  })
  afterEach(() => {
    cy.disconnectMetamaskWalletFromAllDapps()
  })

  it('Should display that wallet is connected to rinkeby', () => {
    MenuBar.getWeb3Status().should('be.visible')
    MenuBar.getNetworkSwitcher().should('contain.text', 'Rinkeby')
  })

  it('Should wrap eth to weth', () => {
    SwapPage.openTokenToSwapMenu()
      .chooseToken('weth')
      .typeValueFrom(TRANSACTION_VALUE.toFixed(9).toString())
      .wrap()
    cy.confirmMetamaskTransaction({ gasFee: 11 })

    cy.window().then(
      async () =>
        await TransactionHelper.checkIfTransactionIsValid(
          parseInt(balanceBefore.result),
          TRANSACTION_VALUE * Math.pow(10, 18),
          AddressesEnum.WETH_TOKEN
        )
    )
    //TODO Not sure why, but cypress do not wait until tx check above is executed
    MenuBar.checkToastMessage('Wrap')
  })

  it('Should unwrap eth to weth', () => {
    SwapPage.openTokenToSwapMenu()
      .chooseToken('eth')
      .openTokenToSwapMenu()
      .chooseToken('weth')
      .typeValueFrom(TRANSACTION_VALUE.toFixed(9).toString())
      .wrap()
    cy.confirmMetamaskTransaction({ gasFee: 11 })

    cy.window().then(
      async () =>
        await TransactionHelper.checkIfTransactionIsValid(
          parseInt(balanceBefore.result),
          -(TRANSACTION_VALUE * Math.pow(10, 18)),
          AddressesEnum.WETH_TOKEN
        )
    )

    //TODO Not sure why, but cypress do not wait until tx check above is executed
    MenuBar.checkToastMessage('Unwrap')
  })
})
