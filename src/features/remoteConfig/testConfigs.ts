type ConfigValue = 'disabled' | 'enabled'

/**
 * List of known test configs.
 *
 * To add a read-only remote test config, first create it
 * in the Firebase Console
 * @see {@link https://firebase.google.com/docs/ab-testing/abtest-config|Firebase AB Testing}
 *
 * then add the key and value here.
 *
 * The config will now be available through {@link isEnabled}.
 *
 * Local test configs can also be added to this list.
 */
export enum TestConfig {
  DisplayExtractedNFTColors = 'extract-nft-colors',
  TokenBalancesQualityFilter = 'token_balances_quality_filter',
  GoerliNFTs = 'goerli-nfts',
  ShowDevSettings = 'show_dev_settings',
}

export const TestConfigValues: Record<TestConfig, ConfigValue> = {
  [TestConfig.DisplayExtractedNFTColors]: __DEV__ ? 'enabled' : 'disabled',
  [TestConfig.TokenBalancesQualityFilter]: 'enabled',
  [TestConfig.GoerliNFTs]: 'disabled',
  [TestConfig.ShowDevSettings]: __DEV__ ? 'enabled' : 'disabled',
}
