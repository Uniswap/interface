import 'cypress-localstorage-commands'
import { TransactionHelper } from '../../utils/TransactionHelper'
import { MenuPage } from '../../pages/MenuPage'
import { SwapPage } from '../../pages/SwapPage'
import { AddressesEnum } from '../../utils/AddressesEnum'

describe('SWAP - Wrapp functionality', () => {
  const TRANSACTION_VALUE: number = 0.000000001

  let balanceBefore: {
    message: string
    result: string
    status: string
  }

  beforeEach(() => {
    cy.clearLocalStorage().clearCookies()
    cy.visit('/')
    MenuPage.connectWallet()
    TransactionHelper.checkTokenBalance(AddressesEnum.WETH_TOKEN).then(balance => {
      console.log('Balance before test:', balance)
      balanceBefore = balance
    })
  })
  afterEach(() => {
    cy.disconnectMetamaskWalletFromAllDapps()
  })

  it('Should wrap eth to weth', () => {
    SwapPage.openTokenToSwapMenu()
      .chooseToken('weth')
      .typeValueIn(TRANSACTION_VALUE.toFixed(9).toString())
      .wrap()
    cy.confirmMetamaskTransaction({ gasFee: 2 })

    cy.window().then(
      async () =>
        await TransactionHelper.checkIfTransactionIsValid(
          parseInt(balanceBefore.result),
          TRANSACTION_VALUE * Math.pow(10, 18),
          AddressesEnum.WETH_TOKEN
        )
    )
    //TODO Not sure why, but cypress do not wait until tx check above is executed
    cy.wait(15000)
  })

  it('Should unwrap eth to weth', () => {
    SwapPage.openTokenToSwapMenu()
      .chooseToken('eth')
      .openTokenToSwapMenu()
      .chooseToken('weth')
      .typeValueIn(TRANSACTION_VALUE.toFixed(9).toString())
      .wrap()
    cy.confirmMetamaskTransaction({ gasFee: 2 })

    cy.window().then(
      async () =>
        await TransactionHelper.checkIfTransactionIsValid(
          parseInt(balanceBefore.result),
          -(TRANSACTION_VALUE * Math.pow(10, 18)),
          AddressesEnum.WETH_TOKEN
        )
    )
    //TODO Not sure why, but cypress do not wait until tx check above is executed
    cy.wait(15000)
  })
})
