import 'etherscan-api/dist/bundle.js'
import './AddressesEnum'
import { AddressesEnum } from './AddressesEnum'

export class TransactionHelper {
  private static waitUntilTxIsFinished() {
    return cy.etherscanWaitForTxSuccess(this.getTxFromStorage())
  }

  static async waitUntilBalanceUpdated(oldBalance: number, newBalance: number) {
    return await this.checkIfBalanceIsUpdated(this.checkIfDifferent(oldBalance, newBalance))
  }

  private static async checkIfBalanceIsUpdated(ifUpdated: boolean): Promise<{ ifUpdated: boolean }> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ifUpdated: ifUpdated })
      }, 5000)
    })
  }

  static checkIfTxHaveNoError() {
    console.log(cy.etherscanGetTransactionStatus(this.getTxFromStorage()))
    cy.etherscanGetTransactionStatus(this.getTxFromStorage()).then(param =>
      expect(param)
        .to.have.property('txStatus')
        .property('result')
        .property('isError', '0')
    )
  }

  static getTxFromStorage() {
    console.log('tx', Object.keys(JSON.parse(localStorage.getItem('swapr_transactions')!)[4])[0])
    return Object.keys(JSON.parse(localStorage.getItem('swapr_transactions')!)[4])[0]
  }

  static async checkTokenBalance(tokenAddress: AddressesEnum) {
    // noinspection JSVoidFunctionReturnValueUsed,TypeScriptValidateJSTypes
    let api = require('etherscan-api').init('25VF97IQZ8EFIYSYFI72UCTJJII3HSZU7Z', 'rinkeby')
    return api.account.tokenbalance(AddressesEnum.WALLET_PUBLIC, '', tokenAddress)
  }

  private static checkIfDifferent(val1: number, val2: number) {
    return !(val1 === val2)
  }

  static async checkIfTransactionIsValid(
    balanceBeforeTransaction: number,
    transactionValue: number,
    tokenAddress: AddressesEnum
  ) {
    TransactionHelper.waitUntilTxIsFinished().then(() => {
      TransactionHelper.checkTokenBalance(tokenAddress).then(transaction => {
        TransactionHelper.waitUntilBalanceUpdated(balanceBeforeTransaction, parseInt(transaction.result)).then(
          async () => {
            await expect(parseInt(transaction.result)).to.be.eq(balanceBeforeTransaction + transactionValue)
          }
        )
      })
    })
  }
}
