/**
 * Datadog RUM Action events
 *
 * DdRum.addAction(DDRumAction.ApplicationStartJs)
 */
export const DDRumAction = {
  ApplicationStartJs: 'application_start_js',
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
}
