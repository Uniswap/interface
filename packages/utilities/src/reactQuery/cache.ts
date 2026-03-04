/**
 * Top level cache keys for react-query queries to ensure unique keys across the universe.
 * Please order alphabetically to reduce merge conflicts.
 */
export enum ReactQueryCacheKey {
  AckNotification = 'AckNotification',
  ActivityScreenRefresh = 'ActivityScreenRefresh',
  AuctionApi = 'AuctionApi',
  BalanceAndUnitags = 'BalanceAndUnitags',
  BlockaidJsonRpcScan = 'BlockaidJsonRpcScan',
  BlockaidTransactionScan = 'BlockaidTransactionScan',
  BlockaidVerification = 'BlockaidVerification',
  BlockNumber = 'BlockNumber',
  CameraPermission = 'CameraPermission',
  CancelPlanStepRequest = 'CancelPlanStepRequest',
  CancelTransactionRequest = 'CancelTransactionRequest',
  CancelUniswapXTransactionRequest = 'CancelUniswapXTransactionRequest',
  CreateTransferTransaction = 'CreateTransferTransaction',
  DataApiService = 'DataApiService',
  DialogVisibility = 'DialogVisibility',
  DensityChartData = 'DensityChartData',
  ExtensionBiometricUnlockCredential = 'ExtensionBiometricUnlockCredential',
  ExtensionBuiltInBiometricCapabilities = 'ExtensionBuiltInBiometricCapabilities',
  ExtractedColors = 'ExtractedColors',
  FORApi = 'FORApi',
  GeneratedAddresses = 'GeneratedAddresses',
  GetPortfolio = 'GetPortfolio',
  GetPortfolioChart = 'GetPortfolioChart',
  GetPosition = 'GetPosition',
  IsErc20ContractAddress = 'IsErc20ContractAddress',
  IsSmartContractAddress = 'IsSmartContractAddress',
  LimitOrdersByHash = 'LimitOrdersByHash',
  LiquidityService = 'LiquidityService',
  ListPositions = 'ListPositions',
  ListTransactions = 'ListTransactions',
  LocalActivities = 'localActivities',
  MismatchAccountBulk = 'MismatchAccountBulk',
  MnemonicUnlocked = 'MnemonicUnlocked',
  DelegatedWalletNativeAllowanceABI = 'DelegatedWalletNativeAllowanceABI',
  Notifications = 'Notifications',
  NotificationService = 'NotificationService',
  OnboardingRedirect = 'OnboardingRedirect',
  OnchainBalances = 'OnchainBalances',
  OnchainENS = 'OnchainENS',
  OnRampAuth = 'OnRampAuth',
  PasskeyAuthStatus = 'PasskeyAuthStatus',
  Permit2SignatureWithData = 'Permit2SignatureWithData',
  PositionCurrencyInfo = 'positionCurrencyInfo',
  PositionTokenURI = 'PositionTokenURI',
  PrepareSwapTransaction = 'PrepareSwapTransaction',
  UniversalImageSvg = 'UniversalImageSvg',
  Session = 'Session',
  SharedUniswapXActivities = 'SharedUniswapXActivities',
  SignatureToActivity = 'SignatureToActivity',
  SolanaConnection = 'SolanaConnection',
  StatsigUser = 'StatsigUser',
  TradingApi = 'TradingApi',
  TradeService = 'TradeService',
  SolanaTradeService = 'SolanaTradeService',
  SwapTxAndGasInfo = 'SwapTxAndGasInfo',
  TokenPrice = 'TokenPrice',
  TransactionToActivity = 'TransactionToActivity',
  UniqueId = 'UniqueId',
  UniswapApi = 'UniswapApi',
  UniswapIdentifier = 'UniswapIdentifier',
  UnitagsApi = 'UnitagsApi',
  WalletDelegation = 'WalletDelegation',
  WalletGetCapabilities = 'WalletGetCapabilities',
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
  ReactQueryCacheKey.TokenPrice,
  ReactQueryCacheKey.UniqueId,
  ReactQueryCacheKey.Session,
] as const
