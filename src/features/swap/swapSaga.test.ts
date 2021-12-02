import { MethodParameters } from '@uniswap/v3-sdk'
import { providers, Wallet } from 'ethers'
import { testSaga } from 'redux-saga-test-plan'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { approveAndSwap, SwapParams } from 'src/features/swap/swapSaga'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

const mockTransactionResponse = {
  wait: jest.fn(),
}

class MockSigner {
  async getAddress() {
    return NULL_ADDRESS
  }

  async signMessage() {
    return ''
  }

  async signTransaction() {
    return '0x123'
  }

  connect() {
    return this
  }

  async sendTransaction() {
    return mockTransactionResponse as unknown as providers.TransactionResponse
  }

  populateTransaction(tx: providers.TransactionRequest) {
    return tx
  }
}

const account: Account = {
  type: AccountType.local,
  address: NULL_ADDRESS,
  name: 'Test Account',
  signer: new MockSigner() as unknown as Wallet,
}

const provider = new providers.JsonRpcProvider(undefined, {
  name: 'Rinkeby',
  chainId: ChainId.RINKEBY,
})

const accountManager = new AccountManager()
accountManager.addAccount(account)

const contractManager = new ContractManager()
contractManager.getOrCreateContract(ChainId.RINKEBY, DAI.address, provider, ERC20_ABI)
const tokenContract = contractManager.getContract(ChainId.RINKEBY, DAI.address) as Erc20

const providerManager: Partial<ProviderManager> = {
  getProvider: (_chainId: ChainId) => provider,
}

const approveParams: ApproveParams = {
  account,
  chainId: ChainId.RINKEBY,
  txAmount: '1',
  contract: tokenContract,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
}

const methodParameters: MethodParameters = {
  value: '0x00',
  calldata: '0x01',
}

const swapParams: SwapParams = { ...approveParams, chainId: ChainId.RINKEBY, methodParameters }
const transaction = {
  from: account.address,
  to: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
  data: '0x01',
}
const transactionWithValue = {
  ...transaction,
  value: '0x02',
}

describe(approveAndSwap, () => {
  it('errors out when approval fails', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call(maybeApprove, swapParams)
      .next(/*approved=*/ false)
      .isDone()
  })

  it('sends a transaction and waits on receipt', () => {
    testSaga(approveAndSwap, swapParams)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call(maybeApprove, swapParams)
      .next(/*approved=*/ true)
      .call([account.signer, account.signer.populateTransaction], transaction)
      .next(transaction)
      .call([account.signer, account.signer.signTransaction], transaction)
      .next('0x123')
      .call([provider, provider.sendTransaction], '0x123')
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next({ transactionHash: '0x123456' })
      .next()
      .isDone()
  })

  it('sends a transaction with value and waits on receipt', () => {
    const params = { ...swapParams, methodParameters: { value: '0x02', calldata: '0x01' } }
    testSaga(approveAndSwap, params)
      .next()
      .call(getWalletAccounts)
      .next(accountManager)
      .call(getWalletProviders)
      .next(providerManager)
      .call(maybeApprove, params)
      .next(/*approved=*/ true)
      .call([account.signer, account.signer.populateTransaction], transactionWithValue)
      .next(transactionWithValue)
      .call([account.signer, account.signer.signTransaction], transactionWithValue)
      .next('0x123')
      .call([provider, provider.sendTransaction], '0x123')
      .next(mockTransactionResponse)
      .call(mockTransactionResponse.wait)
      .next({ transactionHash: '0x123456' })
      .isDone()
  })
})
