import 'etherscan-api/dist/bundle.js'
import './AddressesEnum'
import { EtherscanFacade } from './EtherscanFacade'

export class TransactionHelper {
  static checkIfTxFromLocalStorageHaveNoError() {
    cy.log('Checking tx status from ETHERSCAN API')
    cy.window().then(() => {
      EtherscanFacade.transactionStatus(TransactionHelper.getTxFromStorage()).should(res => {
        expect(res.body.result.isError).to.be.eq('0')
      })
    })
  }

  static checkErc20TokenBalance(tokenAdress: string, balanceBefore: number, transactionValue: number) {
    const expectedBalance: number = transactionValue * Math.pow(10, 18)
    cy.log('Checking token balance from ETHERSCAN API')
    EtherscanFacade.erc20TokenBalance(tokenAdress).should(res => {
      expect(parseInt(res.body.result)).to.be.eq(balanceBefore + expectedBalance)
    })
  }

  private static getTxFromStorage() {
    console.log('tx', Object.keys(JSON.parse(localStorage.getItem('swapr_transactions')!)[4])[0])
    return Object.keys(JSON.parse(localStorage.getItem('swapr_transactions')!)[4])[0]
  }
}
