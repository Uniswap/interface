/**
 * Event names that occur in this specific application
 */
export enum ExtensionEventName {
  ChangeLockedState = 'Change Locked State',
  DappChangeChain = 'Dapp Change Chain',
  DappConnect = 'Dapp Connect',
  DappConnectRequest = 'Dapp Connect Request',
  DappTroubleConnecting = 'Dapp Trouble Connecting',
  DeprecatedMethodRequest = 'DeprecatedMethodRequest',
  ExtensionEthMethodRequest = 'Extension Eth Method Request',
  OnboardingLoad = 'Onboarding Load',
  PasswordChanged = 'Password Changed',
  ProviderDirectMethodRequest = 'Provider Direct Method Request',
  SidebarClosed = 'Sidebard Closed',
  SidebarDisconnect = 'Sidebar Disconnect',
  SidebarLoad = 'Sidebard Load',
  SidebarSwitchChain = 'Sidebar Switch Chain',
  UnknownMethodRequest = 'Unknown Method Request',
}
