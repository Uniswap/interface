import { faker } from '@faker-js/faker'
import {
  NetInfoConnectedStates,
  NetInfoNoConnectionState,
  NetInfoStateType,
  NetInfoUnknownState,
} from '@react-native-community/netinfo'
import { TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { BigNumber, providers } from 'ethers'
import ERC20_ABI from 'wallet/src/abis/erc20.json'
import { Erc20, Weth } from 'wallet/src/abis/types'
import WETH_ABI from 'wallet/src/abis/weth.json'
import { config } from 'wallet/src/config'
import { getNativeAddress, getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, DAI_ARBITRUM_ONE, UNI, WBTC } from 'wallet/src/constants/tokens'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'
import { AssetType } from 'wallet/src/entities/assets'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { Account, AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { initialWalletState } from 'wallet/src/features/wallet/slice'
import { WalletConnectEvent } from 'wallet/src/features/walletConnect/types'
import { currencyId } from 'wallet/src/utils/currencyId'

// Ensures stable fixtures
export const FAKER_SEED = 123
faker.seed(FAKER_SEED)

export const mockSigner = new (class {
  signTransaction = (): string => faker.finance.ethereumAddress()
  connect = (): this => this
})()

export const SAMPLE_PASSWORD = 'my-super-strong-password'
export const SAMPLE_SEED = [
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
].join(' ')
export const SAMPLE_SEED_ADDRESS_1 = '0x82D56A352367453f74FC0dC7B071b311da373Fa6'
export const SAMPLE_SEED_ADDRESS_2 = '0x55f4B664C68F398f9e81EFf63ef4444A1A184F98'

export const MainnetEth = NativeCurrency.onChain(ChainId.Mainnet)
export const PolygonMatic = NativeCurrency.onChain(ChainId.Polygon)
export const ArbitrumEth = NativeCurrency.onChain(ChainId.ArbitrumOne)
export const OptimismEth = NativeCurrency.onChain(ChainId.Optimism)
export const BaseEth = NativeCurrency.onChain(ChainId.Base)

export { faker }

export const account: Account = {
  type: AccountType.SignerMnemonic,
  address: SAMPLE_SEED_ADDRESS_1,
  derivationIndex: 0,
  name: 'Test Account',
  timeImportedMs: 10,
  mnemonicId: SAMPLE_SEED_ADDRESS_1,
  backups: [BackupType.Cloud],
}

export const account2: Account = {
  type: AccountType.Readonly,
  address: SAMPLE_SEED_ADDRESS_2,
  name: 'Test Account',
  timeImportedMs: 10,
}

const mockFeeData = {
  maxFeePerPrice: BigNumber.from('1000'),
  maxPriorityFeePerGas: BigNumber.from('10000'),
  gasPrice: BigNumber.from('10000'),
}

export const mockProvider = {
  getBalance: (): BigNumber => BigNumber.from('1000000000000000000'),
  getGasPrice: (): BigNumber => BigNumber.from('100000000000'),
  getTransactionCount: (): number => 1000,
  estimateGas: (): BigNumber => BigNumber.from('30000'),
  sendTransaction: (): { hash: string } => ({ hash: '0xabcdef' }),
  detectNetwork: (): { name: string; chainId: ChainId } => ({ name: 'mainnet', chainId: 1 }),
  getTransactionReceipt: (): typeof txReceipt => txReceipt,
  waitForTransaction: (): typeof txReceipt => txReceipt,
  getFeeData: (): typeof mockFeeData => mockFeeData,
}

export const mockProviderManager = {
  getProvider: (): typeof mockProvider => mockProvider,
}

export const signerManager = new SignerManager()

export const provider = new providers.JsonRpcProvider()
export const providerManager = {
  getProvider: (): typeof provider => provider,
}

export const mockContractManager = {
  getOrCreateContract: (): typeof mockTokenContract => mockTokenContract,
}

export const mockTokenContract = {
  balanceOf: (): BigNumber => BigNumber.from('1000000000000000000'),
  populateTransaction: {
    transfer: (): typeof txRequest => txRequest,
    transferFrom: (): typeof txRequest => txRequest,
    safeTransferFrom: (): typeof txRequest => txRequest,
  },
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
export const wethContract = contractManager.getContract(
  ChainId.Goerli,
  getWrappedNativeAddress(ChainId.Goerli)
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
  gasPrice: mockFeeData.gasPrice,
}

export const txReceipt = {
  transactionHash: '0x123',
  blockHash: '0x123',
  blockNumber: 1,
  transactionIndex: 1,
  confirmations: 1,
  status: 1,
  confirmedTime: 1400000000000,
  gasUsed: BigNumber.from('100000'),
  effectiveGasPrice: BigNumber.from('1000000000'),
}

export const txResponse = {
  hash: '0x123',
  wait: (): typeof txReceipt => txReceipt,
}

export const txTypeInfo: ApproveTransactionInfo = {
  type: TransactionType.Approve,
  tokenAddress: tokenContract.address,
  spender: UNIVERSAL_ROUTER_ADDRESS(ChainId.Goerli),
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
    blockHash: txReceipt.blockHash,
    blockNumber: txReceipt.blockNumber,
    transactionIndex: txReceipt.transactionIndex,
    confirmations: txReceipt.confirmations,
    confirmedTime: txReceipt.confirmedTime,
    gasUsed: txReceipt.gasUsed.toNumber(),
    effectiveGasPrice: txReceipt.effectiveGasPrice.toNumber(),
  },
}

export const fiatOnRampTxDetailsPending: TransactionDetails = {
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

export const fiatOnRampTxDetailsFailed: TransactionDetails & {
  typeInfo: FiatPurchaseTransactionInfo
} = {
  chainId: ChainId.Mainnet,
  id: '0',
  from: account.address,
  options: {
    request: txRequest,
  },
  typeInfo: {
    type: TransactionType.FiatPurchase,
    explorerUrl:
      'https://buy-sandbox.moonpay.com/transaction_receipt?transactionId=d6c32bb5-7cd9-4c22-8f46-6bbe786c599f',
    id: 'd6c32bb5-7cd9-4c22-8f46-6bbe786c599f',
    syncedWithBackend: true,
  },
  status: TransactionStatus.Failed,
  addedTime: 1487076708000,
  hash: '0x123',
}

export const finalizedTxAction: ReturnType<typeof finalizeTransaction> = {
  payload: { ...txDetailsConfirmed, status: TransactionStatus.Success },
  type: 'transactions/finalizeTransaction',
}

export const swapNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x01',
  txType: TransactionType.Swap,
  txStatus: TransactionStatus.Success,
  inputCurrencyId: `1-${getNativeAddress(ChainId.Mainnet)}`,
  outputCurrencyId: '1-0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  inputCurrencyAmountRaw: '230000000000000000',
  outputCurrencyAmountRaw: '123000000000000000000',
  tradeType: TradeType.EXACT_INPUT,
}

export const transferCurrencyNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Send,
  txStatus: TransactionStatus.Success,
  assetType: AssetType.Currency,
  tokenAddress: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
  currencyAmountRaw: '1000000000000000000',
  recipient: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
  // sender: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const transferNFTNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Send,
  txStatus: TransactionStatus.Success,
  assetType: AssetType.ERC1155,
  tokenAddress: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
  tokenId: '4334',
  recipient: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
  // sender: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
}

export const wcNotification = {
  type: AppNotificationType.WalletConnect,
  chainId: ChainId.Mainnet,
  event: WalletConnectEvent.Connected,
  dappName: 'Uniswap',
  imageUrl: `${config.uniswapAppUrl}/images/192x192_App_Icon.png`,
}

export const approveNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Approve,
  txStatus: TransactionStatus.Success,
  tokenAddress: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
  spender: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const unknownNotification = {
  type: AppNotificationType.Transaction,
  chainId: ChainId.Mainnet,
  txId: 'uid-1234',
  txHash: '0x000',
  txType: TransactionType.Unknown,
  txStatus: TransactionStatus.Success,
  tokenAddress: '0x939C8d89EBC11fA45e576215E2353673AD0bA18A',
}

export const networkUnknown: NetInfoUnknownState = {
  isConnected: null,
  type: NetInfoStateType.unknown,
  isInternetReachable: null,
  details: null,
}

export const networkDown: NetInfoNoConnectionState = {
  isConnected: false,
  type: NetInfoStateType.none,
  isInternetReachable: false,
  details: null,
}

export const ETH = NativeCurrency.onChain(ChainId.Mainnet)

export const networkUp: NetInfoConnectedStates = {
  isConnected: true,
  type: NetInfoStateType.other,
  isInternetReachable: true,
  details: { isConnectionExpensive: false },
}

export const ethCurrencyInfo: CurrencyInfo = {
  currencyId: currencyId(ETH),
  currency: ETH,
  logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
  safetyLevel: SafetyLevel.Verified,
}

export const uniCurrencyInfo: CurrencyInfo = {
  currencyId: currencyId(UNI[ChainId.Mainnet]),
  currency: UNI[ChainId.Mainnet],
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  safetyLevel: SafetyLevel.Verified,
}

export const daiCurrencyInfo: CurrencyInfo = {
  currencyId: currencyId(DAI),
  currency: DAI,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  safetyLevel: SafetyLevel.Verified,
}

export const arbitrumDaiCurrencyInfo: CurrencyInfo = {
  currencyId: currencyId(DAI_ARBITRUM_ONE),
  currency: DAI_ARBITRUM_ONE,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  safetyLevel: SafetyLevel.Verified,
}

// Useful when passing in preloaded state where active account is required
export const mockWalletPreloadedState = {
  wallet: {
    ...initialWalletState,
    accounts: { [account.address]: account },
    activeAccountAddress: account.address,
  },
}

export const mockPool = new Pool(
  UNI[ChainId.Mainnet],
  WBTC,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)
