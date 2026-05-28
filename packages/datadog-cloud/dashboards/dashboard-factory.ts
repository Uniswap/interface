import * as datadog from '@pulumi/datadog'
import { settings } from './config'
import {
  DashboardDefinition,
  DashboardWidgetDefinition,
  GroupWidgetDefinition,
  PresetDefinition,
} from './dashboard-types'

/**
 * Default service definitions for universe presets.
 * Each entry maps a display name to a service tag filter.
 * Add new services here — they'll automatically appear on all dashboards
 * that use getDefaultServicePresets().
 */
export const DEFAULT_SERVICES: Array<{ name: string; filter: string }> = [
  { name: 'Dev Portal', filter: '*dev-portal*' },
]

/**
 * Returns the default set of saved view presets for all universe services.
 * Includes an "All" option plus one preset per service.
 *
 * @param variableName - The template variable name to bind presets to (e.g., 'service', 'cluster')
 * @param opts.filterPrefix - Optional prefix prepended to each service filter
 * @param opts.extra - Optional additional presets appended after the defaults
 */
export function getDefaultServicePresets(
  variableName: string,
  opts?: { filterPrefix?: string; extra?: PresetDefinition[] },
): PresetDefinition[] {
  const prefix = opts?.filterPrefix || ''
  const presets: PresetDefinition[] = [
    {
      name: 'All',
      templateVariables: [{ name: variableName, values: ['*'] }],
    },
    ...DEFAULT_SERVICES.map((svc) => ({
      name: svc.name,
      templateVariables: [{ name: variableName, values: [`${prefix}${svc.filter}`] }],
    })),
  ]

  if (opts?.extra) {
    presets.push(...opts.extra)
  }

  return presets
}

/**
 * Build standard dashboard tags
 * Note: Datadog dashboards only support tags with the `team:` prefix
 */
export function buildDashboardTags(opts: { team: string; additionalTags?: string[] }): string[] {
  const tags = [`team:${opts.team}`]

  if (opts.additionalTags) {
    tags.push(...opts.additionalTags.filter((t) => t.startsWith('team:')))
  }

  return tags
}

/**
 * Transform widget definition recursively to convert layout to widgetLayout
 * for nested groupDefinition widgets
 */
function transformWidgetDefinition(definition: Partial<DashboardWidgetDefinition>): Partial<DashboardWidgetDefinition> {
  if (definition.groupDefinition && Array.isArray(definition.groupDefinition.widgets)) {
    return {
      ...definition,
      groupDefinition: {
        ...definition.groupDefinition,
        widgets: definition.groupDefinition.widgets.map((widget: GroupWidgetDefinition) => {
          const { layout, ...rest } = widget
          return {
            widgetLayout: layout
              ? {
                  x: layout.x,
                  y: layout.y,
                  width: layout.width,
                  height: layout.height,
                }
              : undefined,
            ...transformWidgetDefinition(rest),
          }
        }),
      },
    }
  }

  return definition
}

/**
 * Create a Datadog dashboard from a DashboardDefinition
 */
export function createDashboard(def: DashboardDefinition): datadog.Dashboard {
  const resourceName = `${def.team}-${settings.environment}-${def.id}`

  const tags = buildDashboardTags({
    team: def.team,
    additionalTags: def.additionalTags,
  })

  return new datadog.Dashboard(resourceName, {
    title: def.title,
    description: def.description,
    layoutType: def.layoutType,
    reflowType: def.reflowType,
    tags,

    templateVariables: def.templateVariables.map((tv) => ({
      name: tv.name,
      prefix: tv.prefix,
      defaults: tv.defaults,
      availableValues: tv.availableValues,
    })),

    templateVariablePresets: def.presets?.map((preset) => ({
      name: preset.name,
      templateVariables: preset.templateVariables.map((tv) => ({
        name: tv.name,
        value: tv.value,
        values: tv.values,
      })),
    })),

    widgets: def.widgets.map((w) => ({
      widgetLayout: w.layout
        ? {
            x: w.layout.x,
            y: w.layout.y,
            width: w.layout.width,
            height: w.layout.height,
          }
        : undefined,
      ...transformWidgetDefinition(w.definition),
    })),
  })
}

/**
 * Create multiple dashboards from an array of definitions
 */
export function createDashboards(defs: DashboardDefinition[]): Record<string, datadog.Dashboard> {
  const dashboards: Record<string, datadog.Dashboard> = {}

  for (const def of defs) {
    dashboards[def.id] = createDashboard(def)
  }

  return dashboards
}

/**
 * Create a Datadog dashboard from raw JSON export.
 *
 * Use this when importing a dashboard directly from the Datadog UI JSON export.
 * The JSON is passed through as-is via the DashboardJson resource.
 */
export function createDashboardFromJson(opts: {
  id: string
  team: string
  dashboardJson: object
}): datadog.DashboardJson {
  const resourceName = `${opts.team}-${settings.environment}-${opts.id}`

  return new datadog.DashboardJson(resourceName, {
    dashboard: JSON.stringify(opts.dashboardJson),
  })
}
