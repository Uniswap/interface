import 'cypress-localstorage-commands'
import { MenuBar } from '../../pages/MenuBar'
import { SwapPage } from '../../pages/SwapPage'
import { AddressesEnum } from '../../utils/AddressesEnum'
import { EtherscanFacade } from '../../utils/EtherscanFacade'
import { TransactionHelper } from '../../utils/TransactionHelper'

describe('SWAP functional tests', () => {
  const TRANSACTION_VALUE: number = 0.001

  let balanceBefore: number

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    SwapPage.visitSwapPage()
    MenuBar.connectWallet()

    EtherscanFacade.erc20TokenBalance(AddressesEnum.WETH_TOKEN).then(response => {
      balanceBefore = parseInt(response.body.result)
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

    TransactionHelper.checkIfTxFromLocalStorageHaveNoError()

    MenuBar.checkToastMessage('Wrap')

    TransactionHelper.checkErc20TokenBalance(AddressesEnum.WETH_TOKEN, balanceBefore, TRANSACTION_VALUE)
  })

  it('Should unwrap weth to eth', () => {
    SwapPage.openTokenToSwapMenu()
      .chooseToken('eth')
      .openTokenToSwapMenu()
      .chooseToken('weth')
      .typeValueFrom(TRANSACTION_VALUE.toFixed(9).toString())
      .wrap()
    cy.confirmMetamaskTransaction({ gasFee: 11 })

    TransactionHelper.checkIfTxFromLocalStorageHaveNoError()

    MenuBar.checkToastMessage('Unwrap')

    TransactionHelper.checkErc20TokenBalance(AddressesEnum.WETH_TOKEN,balanceBefore,-(TRANSACTION_VALUE))
  })
})
