/**
 * Datadog RUM Action events
 *
 * DdRum.addAction(DDRumAction.ApplicationStartJs)
 */
export const DDRumAction = {
  ApplicationStartJs: 'application_start_js',
  // Custom, explicitly-named cold-start time-to-interactive action we own, so it survives
  // Datadog RN SDK bumps (the SDK's auto @action.type:application_start stopped emitting at
  // the v2->v3 upgrade). Carries numeric boot fields used to derive our app-start metrics.
  AppStartTti: 'app_start_tti',
  Context: (contextName: string): string => `${contextName} Update`,
  ManualTiming: 'manual_timing',
}

/**
 * Datadog RUM Timing events
 *
 * DdRum.addTiming(DDRumTiming.ScreenInteractive)
 */
export const DDRumTiming = {
  ScreenInteractive: 'screen_interactive',
  // View timing anchored to app-launch, mirroring AppStartTti as a durable view-level signal.
  AppStartTti: 'app_start_tti',
}

/**
 * Datadog RUM manual timing events that we manually created.
 *
 * DdRum.addAction(DDRumAction.ManualTiming, CustomTiming.TokenSelectorListRender, {
 *   ...
 * })
 */
export const DDRumManualTiming = {
  TokenSelectorListRender: 'token_selector_list_render',
  RenderExploreSections: 'render_explore_sections',
  RenderActivityTabList: 'render_activity_tab_list',
  RenderTokenBalanceList: 'render_token_balance_list',
  SwapModalOpen: 'swap_modal_open',
  SwapFormScreenMount: 'swap_form_screen_mount',
  SwapFormContentRender: 'swap_form_content_render',
  SwapDecimalPadLayout: 'swap_decimal_pad_layout',
  SwapReviewScreenRender: 'swap_review_screen_render',
} as const
