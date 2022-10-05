/**
 * Experiment names
 * These should match the Experiment Key on Amplitude
 */
/* eslint-disable @typescript-eslint/naming-convention */
export enum EXPERIMENTS {
  sticky_tabs_header = 'sticky-tabs-header',
}

/**
 * Experiment variants
 * These should match the `Variant Value` on Amplitude
 */

export enum EXP_VARIANTS {
  TABS = 'tabs',
  TITLE_ACTIONS = 'title-actions',
  ACTIONS_TITLES_TABS = 'actions-titles-tabs',
  TITLES_TABS = 'titles-tabs',
}
