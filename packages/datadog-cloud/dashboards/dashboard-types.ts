import * as datadog from '@pulumi/datadog'

/**
 * Template variable definition for dashboard filters
 */
export interface TemplateVariableDefinition {
  /** Variable name (used in queries as $name) */
  name: string
  /** Tag prefix to filter by (e.g., 'unienv' for unienv:* tags) */
  prefix: string
  /** Default value(s) - ['*'] for all */
  defaults: string[]
  /** Available values to show in dropdown (empty = auto-discover) */
  availableValues?: string[]
}

/**
 * Template variable preset for quick filtering
 */
export interface PresetDefinition {
  /** Preset display name */
  name: string
  /** Template variable values for this preset */
  templateVariables: Array<{
    name: string
    /** Single value (deprecated - use values instead) */
    value?: string
    /** Multiple values (preferred) */
    values?: string[]
  }>
}

/**
 * Widget layout position for fixed reflow dashboards
 */
export interface WidgetLayout {
  /** X position (horizontal) */
  x: number
  /** Y position (vertical) */
  y: number
  /** Width in grid units */
  width: number
  /** Height in grid units */
  height: number
}

/**
 * Widget definition that uses 'layout' instead of 'widgetLayout' for consistency.
 * This type is used for widgets inside groupDefinition.
 */
export type GroupWidgetDefinition = Omit<datadog.types.input.DashboardWidgetGroupDefinitionWidget, 'widgetLayout'> & {
  layout?: WidgetLayout
}

/**
 * Extended DashboardWidget that supports 'layout' for nested group widgets
 */
export type DashboardWidgetDefinition = Omit<datadog.types.input.DashboardWidget, 'groupDefinition'> & {
  groupDefinition?: Omit<datadog.types.input.DashboardWidgetGroupDefinition, 'widgets'> & {
    widgets?: GroupWidgetDefinition[]
  }
}

/**
 * Dashboard definition - simplified interface for defining dashboards
 *
 * This mirrors the MonitorDefinition pattern for consistency.
 */
export interface DashboardDefinition {
  /** Unique identifier (used in resource name, e.g., 'dev-portal_overview') */
  id: string

  /** Dashboard title */
  title: string

  /** Dashboard description */
  description?: string

  /** Owning team (used for tagging and resource naming) */
  team: string

  /** Layout type - 'ordered' for grid layout, 'free' for absolute positioning */
  layoutType: 'ordered' | 'free'

  /** Reflow type for ordered layouts - 'fixed' requires layouts, 'auto' does not */
  reflowType?: 'auto' | 'fixed'

  /** Template variables for filtering */
  templateVariables: TemplateVariableDefinition[]

  /** Presets for quick filtering */
  presets?: PresetDefinition[]

  /**
   * Widget definitions using Pulumi Dashboard widget format.
   * Each widget should have exactly one definition type
   * (e.g., listStreamDefinition, manageStatusDefinition, etc.)
   *
   * For groupDefinition widgets, use 'layout' instead of 'widgetLayout'
   * for nested widgets. The factory will transform this to the correct format.
   */
  widgets: Array<{
    /** Layout position (required for 'fixed' reflow type) */
    layout?: WidgetLayout
    /**
     * Widget definition - should contain exactly one widget type property.
     * Examples:
     * - { listStreamDefinition: {...} }
     * - { manageStatusDefinition: {...} }
     * - { timeseriesDefinition: {...} }
     * - { groupDefinition: { widgets: [{ layout: {...}, noteDefinition: {...} }] } }
     */
    definition: Partial<DashboardWidgetDefinition>
  }>

  /** Additional tags beyond the standard ones (team, env, managed-by) */
  additionalTags?: string[]
}
