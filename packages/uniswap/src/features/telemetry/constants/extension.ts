/**
 * Event names that occur in this specific application
 */
export enum ExtensionEventName {
  DappConnect = 'Dapp Connect',
  DappConnectRequest = 'Dapp Connect Request',
  DappChangeChain = 'Dapp Change Chain',
  DeprecatedMethodRequest = 'DeprecatedMethodRequest',
  ExtensionLoad = 'Extension Load',
  ExtensionEthMethodRequest = 'Extension Eth Method Request',
  ProviderDirectMethodRequest = 'Provider Direct Method Request',
  SidebarDisconnect = 'Sidebar Disconnect',
  SidebarSwitchChain = 'Sidebar Switch Chain',
  UnknownMethodRequest = 'Unknown Method Request',
}
