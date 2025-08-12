import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { FeeData } from 'components/Liquidity/Create/types'
import { isDynamicFeeTier } from 'components/Liquidity/utils/feeTiers'

interface ParsedParams {
  // Current params
  currencyA?: string | null
  currencyB?: string | null
  fee?: FeeData | null

  // Deprecated params for migration
  feeTier?: string | null
  isDynamic?: boolean | null
  currencya?: string | null
  currencyb?: string | null
}

interface UrlMigrationResult {
  // Updated parameter values after migration
  updatedParams: Partial<ParsedParams>
  // List of parameter names that should be cleared from URL
  clearParams: string[]
}

interface UrlMigration {
  version: number
  migrate: (params: ParsedParams) => UrlMigrationResult | null
}

/**
 * Handle backwards compatibility for deprecated parameters
 * V1 Migration:
 * - feeTier + isDynamic → fee (FeeData object)
 */
function migrateFee(params: ParsedParams): UrlMigrationResult | null {
  const updates: Partial<ParsedParams> = {}
  const clearParams: string[] = []
  let hasMigrations = false

  // Migrate feeTier + isDynamic to fee object
  if (params.feeTier) {
    const feeTierNumber = Number(params.feeTier)
    const tickSpacing = TICK_SPACINGS[feeTierNumber as FeeAmount] || TICK_SPACINGS[FeeAmount.MEDIUM]

    updates.fee = {
      feeAmount: feeTierNumber,
      tickSpacing,
      isDynamic: isDynamicFeeTier({
        feeAmount: feeTierNumber,
        tickSpacing,
        isDynamic: Boolean(params.isDynamic),
      }),
    }

    clearParams.push('feeTier', 'isDynamic')
    hasMigrations = true
  }

  return hasMigrations ? { updatedParams: updates, clearParams } : null
}

function migrateCurrency(params: ParsedParams): UrlMigrationResult | null {
  const updates: Partial<ParsedParams> = {}
  const clearParams: string[] = []
  let hasMigrations = false

  if (params.currencya && !params.currencyA) {
    updates.currencyA = params.currencya
    clearParams.push('currencya')
    hasMigrations = true
  }

  if (params.currencyb && !params.currencyB) {
    updates.currencyB = params.currencyb
    clearParams.push('currencyb')
    hasMigrations = true
  }

  return hasMigrations ? { updatedParams: updates, clearParams } : null
}

/**
 * Registry of all URL parameter migrations
 * Add new migrations here as URL parameters evolve
 */
const URL_MIGRATIONS: UrlMigration[] = [
  {
    version: 1,
    migrate: migrateFee,
  },
  {
    version: 2,
    migrate: migrateCurrency,
  },
]

/**
 * Apply all URL parameter migrations to the given params
 * @param params - Parsed URL parameters that may contain deprecated values
 * @returns Migration result with updated params and cleanup list, or null if no migrations needed
 */
export function applyUrlMigrations(params: ParsedParams): UrlMigrationResult | null {
  const allUpdates: Partial<ParsedParams> = {}
  const allClearParams: string[] = []
  let hasMigrations = false

  // Apply each migration in order
  for (const migration of URL_MIGRATIONS) {
    const result = migration.migrate(params)
    if (result) {
      // Merge updates
      Object.assign(allUpdates, result.updatedParams)
      // Collect all clear params
      allClearParams.push(...result.clearParams)
      hasMigrations = true

      // Update params for next migration (in case migrations depend on each other)
      Object.assign(params, result.updatedParams)
    }
  }

  return hasMigrations
    ? {
        updatedParams: allUpdates,
        clearParams: [...new Set(allClearParams)], // Remove duplicates
      }
    : null
}
