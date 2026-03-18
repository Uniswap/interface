/**
 * Event names that occur in this specific application
 */
export enum ExtensionEventName {
  BackgroundAttemptedToOpenSidebar = 'Background Attempted To Open Sidebar',
  ChangeLockedState = 'Change Locked State',
  DappChangeChain = 'Dapp Change Chain',
  DappConnect = 'Dapp Connect',
  DappConnectRequest = 'Dapp Connect Request',
  DappDisconnect = 'Dapp Disconnect',
  DappDisconnectAll = 'Dapp Disconnect All',
  DappRequest = 'Dapp Request',
  DappTroubleConnecting = 'Dapp Trouble Connecting',
  DeprecatedMethodRequest = 'Deprecated Method Request',
  ExtensionEthMethodRequest = 'Extension Eth Method Request',
  OnboardingLoad = 'Onboarding Load',
  PasswordChanged = 'Password Changed',
  ProviderDirectMethodRequest = 'Provider Direct Method Request',
  SidebarClosed = 'Sidebar Closed',
  SidebarConnect = 'Sidebar Connect',
  SidebarDisconnect = 'Sidebar Disconnect',
  SidebarLoad = 'Sidebard Load',
  SidebarSwitchChain = 'Sidebar Switch Chain',
  UnknownMethodRequest = 'Unknown Method Request',
  UnsupportedMethodRequest = 'Unsupported Method Request',
  UnrecognizedMethodRequest = 'Unrecognized Method Request',
  // alphabetize additional values.
}
