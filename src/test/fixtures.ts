import { BigNumber, providers } from 'ethers'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20, Weth } from 'src/abis/types'
import WETH_ABI from 'src/abis/weth.json'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { DAI, WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { ContractManager } from 'src/features/contracts/ContractManager'
import {
  ApproveTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

export const account: Account = {
  type: AccountType.Local,
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  name: 'Test Account',
}

const mockSigner = new (class {
  signTransaction = jest.fn(() => '0x1234567890abcdef')
  connect = () => this
})()

export const mockSignerManager = {
  getSignerForAccount: async () => mockSigner,
}

const mockProvider = {
  getGasPrice: jest.fn(() => BigNumber.from('100000000000')),
  getTransactionCount: jest.fn(() => 1000),
  estimateGas: jest.fn(() => BigNumber.from('30000')),
  sendTransaction: jest.fn(() => ({ hash: '0xabcdef' })),
}

export const mockProviderManager = {
  getProvider: () => mockProvider,
}

export const signerManager = new SignerManager()

export const provider = new providers.JsonRpcProvider()
export const providerManager = {
  getProvider: () => provider,
}

export const contractManager = new ContractManager()
contractManager.getOrCreateContract(ChainId.Rinkeby, DAI.address, provider, ERC20_ABI)
contractManager.getOrCreateContract(
  ChainId.Rinkeby,
  WRAPPED_NATIVE_CURRENCY[ChainId.Rinkeby].address,
  provider,
  WETH_ABI
)
export const tokenContract = contractManager.getContract(ChainId.Rinkeby, DAI.address) as Erc20
export const wethContract = contractManager.getContract(
  ChainId.Rinkeby,
  WRAPPED_NATIVE_CURRENCY[ChainId.Rinkeby].address
) as Weth

/**
 * Transactions
 */
export const txRequest: providers.TransactionRequest = {
  from: '0x123',
  to: '0x456',
  value: '0x0',
  data: '0x789',
  nonce: 10,
}

export const txReceipt = {
  transactionHash: '0x123',
  blockHash: '0x123',
  blockNumber: 1,
  transactionIndex: 1,
  confirmations: 1,
  status: 1,
}

export const txResponse = {
  hash: '0x123',
  wait: jest.fn(() => txReceipt),
}

export const txTypeInfo: ApproveTransactionInfo = {
  type: TransactionType.Approve,
  tokenAddress: tokenContract.address,
  spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
}

export const txDetailsPending: TransactionDetails = {
  chainId: ChainId.Mainnet,
  id: '0',
  from: account.address,
  options: {
    request: txRequest,
  },
  typeInfo: txTypeInfo,
  status: TransactionStatus.Pending,
  addedTime: 1487076708000,
  hash: '0x123',
}

export const txDetailsConfirmed: TransactionDetails = {
  ...txDetailsPending,
  status: TransactionStatus.Success,
  receipt: {
    transactionIndex: 0,
    blockHash: '0x123',
    blockNumber: 456,
    confirmedTime: 1487076808000,
    confirmations: 1,
  },
}
