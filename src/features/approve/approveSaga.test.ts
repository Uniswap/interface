import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { providers, Wallet } from 'ethers'
import { testSaga } from 'redux-saga-test-plan'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { DAI } from 'src/constants/tokens'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import { TransactionType } from 'src/features/transactions/types'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

class MockSigner {
  async getAddress() {
    return NULL_ADDRESS
  }

  async signMessage() {
    return ''
  }

  async signTransaction() {
    return ''
  }

  connect() {
    return this
  }
}

const account: Account = {
  type: AccountType.local,
  address: NULL_ADDRESS,
  name: 'Test Account',
  signer: new MockSigner() as unknown as Wallet,
}

const provider = new providers.JsonRpcProvider()
const providerManager = {
  getProvider: () => provider,
}

const accountManager = new AccountManager()
accountManager.addAccount(account)

const contractManager = new ContractManager()
contractManager.getOrCreateContract(ChainId.RINKEBY, DAI.address, provider, ERC20_ABI)
const tokenContract = contractManager.getContract(ChainId.RINKEBY, DAI.address) as Erc20

const approveParams: ApproveParams = {
  account,
  chainId: ChainId.RINKEBY,
  txAmount: '1',
  contract: tokenContract,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

const transactionResponse = { hash: '0x123', wait: () => {} }
const transactionReceipt = {}

describe(maybeApprove, () => {
  it('skips approval when allowance is sufficient', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([account.signer, account.signer.connect], provider)
      .next(account.signer)
      .call([tokenContract, tokenContract.connect], account.signer)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from(approveParams.txAmount).add('1000'))
      .isDone()
  })

  it('ignores failed allowance check', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([account.signer, account.signer.connect], provider)
      .next(account.signer)
      .call([tokenContract, tokenContract.connect], account.signer)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .throw(new Error('Failed to get allowance'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
  })

  it('approves maximum amount', () => {
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call([account.signer, account.signer.connect], provider)
      .next(account.signer)
      .call([tokenContract, tokenContract.connect], account.signer)
      .next(tokenContract)
      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .next(BigNumber.from(100_000))
      .call(approveParams.contract.approve, approveParams.spender, MaxUint256, {
        gasLimit: BigNumber.from(100_000).mul(GAS_INFLATION_FACTOR),
      })
      .next(transactionResponse)
      .call(addTransaction, transactionResponse, {
        type: TransactionType.APPROVE,
        tokenAddress: tokenContract.address,
        spender: approveParams.spender,
      })
      .next()
      .call(transactionResponse.wait)
      .next(transactionReceipt)
      .call(finalizeTransaction, transactionResponse, transactionReceipt)
      .next()
      .isDone()
  })

  it('approves exact amount', () => {
    const approvedAmount = BigNumber.from(approveParams.txAmount)
    testSaga(maybeApprove, approveParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)

      .call(getWalletProviders)
      .next(providerManager)
      .call([account.signer, account.signer.connect], provider)
      .next(account.signer)
      .call([tokenContract, tokenContract.connect], account.signer)
      .next(tokenContract)

      .call(approveParams.contract.allowance, approveParams.account.address, approveParams.spender)
      .next(BigNumber.from('0'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, MaxUint256)
      .throw(new Error('Failed to estimate gas'))
      .call(approveParams.contract.estimateGas.approve, approveParams.spender, approvedAmount)
      .next(BigNumber.from(120_000))
      .call(approveParams.contract.approve, approveParams.spender, approvedAmount, {
        gasLimit: BigNumber.from(120_000).mul(GAS_INFLATION_FACTOR),
      })
      .next(transactionResponse)
      .call(addTransaction, transactionResponse, {
        type: TransactionType.APPROVE,
        tokenAddress: tokenContract.address,
        spender: approveParams.spender,
      })
      .next()
      .call(transactionResponse.wait)
      .next(transactionReceipt)
      .call(finalizeTransaction, transactionResponse, transactionReceipt)
      .next()
      .isDone()
  })

  // TODO: switch to integration testing with redux-saga-test-poaan
  // The sample `expectSaga` test redux-saga-test-plan does not pass for me.. figure out why
  // xit('skips approval when allowance is sufficient', () => {
  //   return expectSaga(approveSaga)
  //     .provide([
  //       [call(getWalletAccounts), accountManager],
  //       [
  //         call(tokenContract.allowance, account.address, approveParams.spender),
  //         approveParams.txAmount.add(10),
  //       ],
  //     ])
  //     .dispatch(approveActions.trigger(approveParams))
  //     .silentRun(50)
  // })
})
