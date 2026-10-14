/** What a press of the swap form CTA does. Logged as `action` on its `swap-review` Element Clicked event. */
export enum SwapFormButtonAction {
  VerifyIdentity = 'verify_identity',
  GeoAcknowledgment = 'geo_acknowledgment',
  AddFunds = 'add_funds',
  Redirect = 'redirect',
  ConnectWallet = 'connect_wallet',
  ConnectPlatform = 'connect_platform',
  ViewOnly = 'view_only',
  Review = 'review',
}
