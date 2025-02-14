/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  ArbitrumXV2Sampling = 'arbitrum_uniswapx_sampling',
  AccountCTAs = 'signin_login_connect_ctas',
}

export enum ArbitrumXV2SamplingGroup {
  Classic = 'Classic',
  DutchV2 = 'DutchV2',
  DutchV3 = 'DutchV3',
}

export enum ArbitrumXV2SamplingProperties {
  RoutingType = 'routingType',
}

export enum AccountCTAsExperimentGroup {
  Control = 'Control', // Get the app / Connect
  SignInSignUp = 'SignIn-SignUp',
  LogInCreateAccount = 'LogIn-CreateAccount',
}

export type ExperimentProperties = {
  [Experiments.ArbitrumXV2Sampling]: ArbitrumXV2SamplingProperties
}
