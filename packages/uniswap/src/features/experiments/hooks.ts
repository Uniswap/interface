/* eslint-disable @typescript-eslint/no-unused-vars */

// import { DynamicConfigs, getConfigName } from 'uniswap/src/features/experiments/configs'
import { FeatureFlags } from 'uniswap/src/features/experiments/flags'
// import {
//   DynamicConfig,
//   useConfig,
//   useExperiment,
//   useExperimentWithExposureLoggingDisabled,
//   useGate,
//   useGateWithExposureLoggingDisabled,
// } from 'uniswap/src/features/experiments/statsig/statsig'
import { ExperimentsWallet } from './constants'

const values: { [K in FeatureFlags]: boolean } = {
  // Shared
  [FeatureFlags.CurrencyConversion]: false,
  [FeatureFlags.UniconsV2]: false,
  [FeatureFlags.Unitags]: false,

  // Wallet
  [FeatureFlags.ExtensionOnboarding]: false,
  [FeatureFlags.FeedTab]: false,
  [FeatureFlags.ForAggregator]: false,
  [FeatureFlags.CexTransfers]: false,
  [FeatureFlags.GatewayDNSUpdateMobile]: false,
  [FeatureFlags.LanguageSelection]: false,
  [FeatureFlags.MevBlocker]: false,
  [FeatureFlags.PortionFields]: false,
  [FeatureFlags.RestoreWallet]: false,
  [FeatureFlags.Scantastic]: false,
  [FeatureFlags.SeedPhraseRefactorNative]: false,
  [FeatureFlags.SendRewrite]: false,
  [FeatureFlags.TradingApi]: false,
  [FeatureFlags.UnitagsDeviceAttestation]: false,
  [FeatureFlags.UwULink]: false,

  // Web
  [FeatureFlags.Eip6936Enabled]: false,
  [FeatureFlags.ExitAnimation]: false,
  [FeatureFlags.ExtensionBetaLaunch]: false,
  [FeatureFlags.ExtensionGeneralLaunch]: false,
  [FeatureFlags.GqlTokenLists]: false,
  [FeatureFlags.LimitsEnabled]: false,
  [FeatureFlags.LimitsFees]: false,
  [FeatureFlags.MultichainUX]: false,
  [FeatureFlags.QuickRouteMainnet]: false,
  [FeatureFlags.Realtime]: false,
  [FeatureFlags.SendEnabled]: true,
  [FeatureFlags.TraceJsonRpc]: false,
  [FeatureFlags.UniswapXSyntheticQuote]: false,
  [FeatureFlags.UniswapXv2]: false,
  [FeatureFlags.V2Everywhere]: true,

  // Outage banners
  [FeatureFlags.OutageBannerArbitrum]: false,
  [FeatureFlags.OutageBannerOptimism]: false,
  [FeatureFlags.OutageBannerPolygon]: false,
}

export function useFeatureFlag(flag: FeatureFlags): boolean {
  // const name = getFeatureFlagName(flag)
  // const { value } = useGate(name)
  // return value
  return values[flag]
}

export function useFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  // const name = getFeatureFlagName(flag)
  // const { value } = useGateWithExposureLoggingDisabled(name)
  // return value
  return values[flag]
}

export function useExperimentEnabled(experimentName: ExperimentsWallet): boolean {
  // return useExperiment(experimentName).config.getValue(ExperimentParamsWallet.Enabled) as boolean
  return false
}

export function useExperimentEnabledWithExposureLoggingDisabled(
  experimentName: ExperimentsWallet
): boolean {
  // return useExperimentWithExposureLoggingDisabled(experimentName).config.getValue(
  //   ExperimentParamsWallet.Enabled
  // ) as boolean
  return false
}

// export function useDynamicConfig(config: DynamicConfigs): DynamicConfig {
//   const name = getConfigName(config)
//   const { config: dynamicConfig } = useConfig(name)
//   return dynamicConfig
// }
