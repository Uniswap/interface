/**
 * Top level cache keys for react-query queries to ensure unique keys across the universe.
 * Please order alphabetically to reduce merge conflicts.
 */
export enum ReactQueryCacheKey {
  BalanceAndUnitags = 'BalanceAndUnitags',
  CameraPermission = 'CameraPermission',
  CancelTransactionRequest = 'CancelTransactionRequest',
  CancelUniswapXTransactionRequest = 'CancelUniswapXTransactionRequest',
  CreateTransferTransaction = 'CreateTransferTransaction',
  DensityChartData = 'DensityChartData',
  ExtractedColors = 'ExtractedColors',
  GeneratedAddresses = 'GeneratedAddresses',
  IsErc20ContractAddress = 'IsErc20ContractAddress',
  IsSmartContractAddress = 'IsSmartContractAddress',
  LocalActivities = 'localActivities',
  MismatchAccount = 'MismatchAccount',
  MnemonicUnlocked = 'MnemonicUnlocked',
  OnboardingRedirect = 'OnboardingRedirect',
  OnchainBalances = 'OnchainBalances',
  OnchainENS = 'OnchainENS',
  PasskeyAuthStatus = 'PasskeyAuthStatus',
  Permit2SignatureWithData = 'Permit2SignatureWithData',
  PositionCurrencyInfo = 'positionCurrencyInfo',
  PositionTokenURI = 'PositionTokenURI',
  RemoteSvg = 'RemoteSvg',
  SignatureToActivity = 'SignatureToActivity',
  StatsigUser = 'StatsigUser',
  TradingApi = 'TradingApi',
  TransactionToActivity = 'TransactionToActivity',
  UniqueId = 'UniqueId',
  UniswapApi = 'UniswapApi',
  UnitagsApi = 'UnitagsApi',
  WalletDelegation = 'WalletDelegation',
  WalletGetCapabilities = 'WalletGetCapabilities',
  WebTransactionGasFee = 'WebTransactionGasFee',
  WrapTransactionRequest = 'WrapTransactionRequest',
}

/**
 * These queries will not be persisted to disk.
 *
 * Some reasons to not persist a query:
 * - The query response includes a non-serializable object.
 * - The query data includes sensitive information.
 *
 * Note that any query with `gcTime: 0` will not be persisted to disk even if it's not in this list.
 */
export const DISABLE_CACHE_PERSISTENCE_TO_DISK: ReactQueryCacheKey[] = [] as const
