/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  AccountCTAs = 'signin_login_connect_ctas',
  SwapPresets = 'swap_presets',
  NativeTokenPercentageBuffer = 'lp_native_eth_buffer',
}

export enum Layers {
  SwapPage = 'swap-page',
}

// experiment groups

export enum AccountCTAsExperimentGroup {
  Control = 'Control', // Get the app / Connect
  SignInSignUp = 'SignIn-SignUp',
  LogInCreateAccount = 'LogIn-CreateAccount',
}

export enum NativeTokenPercentageBufferExperimentGroup {
  Control = 'Control',
  Buffer1 = 'Buffer1',
}

// experiment properties

export enum ArbitrumXV2SamplingProperties {
  RoutingType = 'routingType',
}

export enum SwapPresetsProperties {
  InputEnabled = 'inputEnabled',
  OutputEnabled = 'outputEnabled',
}

export type ExperimentProperties = {
  [Experiments.SwapPresets]: SwapPresetsProperties
}

// will be a spread of all experiment properties in that layer
export const LayerProperties: Record<Layers, string[]> = {
  [Layers.SwapPage]: Object.values(SwapPresetsProperties),
}
