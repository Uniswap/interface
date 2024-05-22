import { TransactionReceipt } from '@ethersproject/providers'
import { BigNumber, providers } from 'ethers'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { Erc20 } from 'uniswap/src/abis/types'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI } from 'wallet/src/constants/tokens'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { ethersTransactionReceipt } from 'wallet/src/test/fixtures'

export const signerManager = new SignerManager()

export const provider = new providers.JsonRpcProvider()
export const providerManager = {
  getProvider: (): typeof provider => provider,
}

const mockFeeData = {
  maxFeePerPrice: BigNumber.from('1000'),
  maxPriorityFeePerGas: BigNumber.from('10000'),
  gasPrice: BigNumber.from('10000'),
}

type TxProvidersMocks = {
  mockProvider: typeof provider
  mockProviderManager: typeof providerManager
}

export const getTxProvidersMocks = (txReceipt?: TransactionReceipt): TxProvidersMocks => {
  const receipt = txReceipt ?? ethersTransactionReceipt()

  const mockProvider = {
    getBalance: (): BigNumber => BigNumber.from('1000000000000000000'),
    getGasPrice: (): BigNumber => BigNumber.from('100000000000'),
    getTransactionCount: (): number => 1000,
    estimateGas: (): BigNumber => BigNumber.from('30000'),
    sendTransaction: (): { hash: string } => ({ hash: '0xabcdef' }),
    detectNetwork: (): { name: string; chainId: ChainId } => ({
      name: 'mainnet',
      chainId: 1,
    }),
    getTransactionReceipt: (): typeof receipt => receipt,
    waitForTransaction: (): typeof receipt => receipt,
    getFeeData: (): typeof mockFeeData => mockFeeData,
  }

  const mockProviderManager = {
    getProvider: (): typeof mockProvider => mockProvider,
  }

  return {
    mockProvider,
    mockProviderManager,
  } as unknown as TxProvidersMocks
}

export const contractManager = new ContractManager()
contractManager.getOrCreateContract(ChainId.Goerli, DAI.address, provider, ERC20_ABI)
contractManager.getOrCreateContract(
  ChainId.Goerli,
  getWrappedNativeAddress(ChainId.Goerli),
  provider,
  WETH_ABI
)
export const tokenContract = contractManager.getContract(ChainId.Goerli, DAI.address) as Erc20

export const mockTokenContract = {
  balanceOf: (): BigNumber => BigNumber.from('1000000000000000000'),
  populateTransaction: {},
}

export const mockContractManager = {
  getOrCreateContract: (): typeof mockTokenContract => mockTokenContract,
}
