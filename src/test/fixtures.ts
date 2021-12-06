import { BigNumber, providers } from 'ethers'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { ContractManager } from 'src/features/contracts/ContractManager'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account, AccountType } from 'src/features/wallet/accounts/types'

export const account: Account = {
  type: AccountType.local,
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
contractManager.getOrCreateContract(ChainId.RINKEBY, DAI.address, provider, ERC20_ABI)
export const tokenContract = contractManager.getContract(ChainId.RINKEBY, DAI.address) as Erc20
