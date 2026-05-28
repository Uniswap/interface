export type ViewPrivateKeysScreenState = {
  /**
   * Since this screen can be accessed via Settings or OnboardingStack,
   * showHeader is used to determine if the header should be shown or
   * to defer to the parent screen to show the header.
   */
  showHeader?: boolean
}
