/**
 * Top level cache keys for react-query queries to ensure unique keys across the universe.
 * Please order alphabetically to reduce merge conflicts.
 */
export enum ReactQueryCacheKey {
  ActivityScreenRefresh = 'ActivityScreenRefresh',
  BalanceAndUnitags = 'BalanceAndUnitags',
  CameraPermission = 'CameraPermission',
  CancelTransactionRequest = 'CancelTransactionRequest',
  CancelUniswapXTransactionRequest = 'CancelUniswapXTransactionRequest',
  CreateTransferTransaction = 'CreateTransferTransaction',
  DensityChartData = 'DensityChartData',
  ExtensionBiometricUnlockCredential = 'ExtensionBiometricUnlockCredential',
  ExtensionBuiltInBiometricCapabilities = 'ExtensionBuiltInBiometricCapabilities',
  ExtractedColors = 'ExtractedColors',
  GeneratedAddresses = 'GeneratedAddresses',
  GetPortfolio = 'GetPortfolio',
  IsErc20ContractAddress = 'IsErc20ContractAddress',
  IsSmartContractAddress = 'IsSmartContractAddress',
  LimitOrdersByHash = 'LimitOrdersByHash',
  ListTransactions = 'ListTransactions',
  LocalActivities = 'localActivities',
  MismatchAccountBulk = 'MismatchAccountBulk',
  MnemonicUnlocked = 'MnemonicUnlocked',
  OnboardingRedirect = 'OnboardingRedirect',
  OnchainBalances = 'OnchainBalances',
  OnchainENS = 'OnchainENS',
  OnRampAuth = 'OnRampAuth',
  PasskeyAuthStatus = 'PasskeyAuthStatus',
  Permit2SignatureWithData = 'Permit2SignatureWithData',
  PositionCurrencyInfo = 'positionCurrencyInfo',
  PositionTokenURI = 'PositionTokenURI',
  PrepareSwapTransaction = 'PrepareSwapTransaction',
  RemoteSvg = 'RemoteSvg',
  SharedUniswapXActivities = 'SharedUniswapXActivities',
  SignatureToActivity = 'SignatureToActivity',
  SolanaConnection = 'SolanaConnection',
  StatsigUser = 'StatsigUser',
  TradingApi = 'TradingApi',
  TradeService = 'TradeService',
  SolanaTradeService = 'SolanaTradeService',
  SwapTxAndGasInfo = 'SwapTxAndGasInfo',
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
export const DISABLE_CACHE_PERSISTENCE_TO_DISK: ReactQueryCacheKey[] = [
  // This query returns a non-serializable react component (the biometric icon).
  ReactQueryCacheKey.ExtensionBuiltInBiometricCapabilities,
  // This ensures when a user switches mobile devices that the unique id will be reset
  ReactQueryCacheKey.UniqueId,
] as const
