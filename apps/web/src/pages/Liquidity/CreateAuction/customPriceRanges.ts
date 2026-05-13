import {
  type CustomPriceRangeEntry,
  type CustomPriceRangePreset,
  type CustomPriceRangeValue,
  CustomPriceRangeBound,
  MAX_CUSTOM_PRICE_RANGE_ENTRIES,
} from '~/pages/Liquidity/CreateAuction/types'
const CUSTOM_PRICE_RANGE_ID_PREFIX = 'custom-range-'
const CUSTOM_PRICE_RANGE_PERCENT_PRECISION = 10 ** 5

function roundCustomPriceRangePercent(percent: number): number {
  return Math.round(percent * CUSTOM_PRICE_RANGE_PERCENT_PRECISION) / CUSTOM_PRICE_RANGE_PERCENT_PRECISION
}

export function clampCustomPriceRangeLiquidityPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    return 0
  }
  return roundCustomPriceRangePercent(Math.min(Math.max(percent, 0), 100))
}

export function createDefaultCustomPriceRangeEntry(): CustomPriceRangeEntry {
  return {
    id: `${CUSTOM_PRICE_RANGE_ID_PREFIX}1`,
    liquidityPercent: 100,
    minPercentFromClearing: CustomPriceRangeBound.NegativeInfinity,
    maxPercentFromClearing: CustomPriceRangeBound.PositiveInfinity,
  }
}

function getNextCustomPriceRangeId(entries: CustomPriceRangeEntry[]): string {
  const maxNumericId = entries.reduce((maxId, entry) => {
    const parsed = Number(entry.id.replace(CUSTOM_PRICE_RANGE_ID_PREFIX, ''))
    return Number.isFinite(parsed) ? Math.max(maxId, parsed) : maxId
  }, 0)
  return `${CUSTOM_PRICE_RANGE_ID_PREFIX}${maxNumericId + 1}`
}

export function getCustomPriceRangeLiquidityTotal(entries: CustomPriceRangeEntry[]): number {
  return roundCustomPriceRangePercent(entries.reduce((sum, entry) => sum + entry.liquidityPercent, 0))
}

function rebalanceCustomPriceRangePercents(
  entries: CustomPriceRangeEntry[],
  preferredEntryId: string,
): CustomPriceRangeEntry[] {
  const nextEntries = entries.map((entry) => ({
    ...entry,
    liquidityPercent: clampCustomPriceRangeLiquidityPercent(entry.liquidityPercent),
  }))

  if (nextEntries.length === 1) {
    return nextEntries.map((entry) => ({ ...entry, liquidityPercent: 100 }))
  }

  let delta = roundCustomPriceRangePercent(100 - getCustomPriceRangeLiquidityTotal(nextEntries))
  for (let i = nextEntries.length - 1; i >= 0 && delta !== 0; i--) {
    const entry = nextEntries[i]!
    if (entry.id === preferredEntryId) {
      continue
    }

    if (delta > 0) {
      const increase = Math.min(100 - entry.liquidityPercent, delta)
      entry.liquidityPercent = roundCustomPriceRangePercent(entry.liquidityPercent + increase)
      delta = roundCustomPriceRangePercent(delta - increase)
    } else {
      const decrease = Math.min(entry.liquidityPercent, Math.abs(delta))
      entry.liquidityPercent = roundCustomPriceRangePercent(entry.liquidityPercent - decrease)
      delta = roundCustomPriceRangePercent(delta + decrease)
    }
  }

  return nextEntries
}

export function addCustomPriceRangePreset(
  entries: CustomPriceRangeEntry[],
  preset: CustomPriceRangePreset,
): CustomPriceRangeEntry[] {
  if (entries.length >= MAX_CUSTOM_PRICE_RANGE_ENTRIES) {
    return entries
  }

  const remainingPercent = clampCustomPriceRangeLiquidityPercent(100 - getCustomPriceRangeLiquidityTotal(entries))
  return [
    ...entries,
    {
      id: getNextCustomPriceRangeId(entries),
      liquidityPercent: remainingPercent,
      minPercentFromClearing: preset.minPercentFromClearing,
      maxPercentFromClearing: preset.maxPercentFromClearing,
    },
  ]
}

export function updateCustomPriceRangeLiquidityPercent({
  entries,
  entryId,
  percent,
}: {
  entries: CustomPriceRangeEntry[]
  entryId: string
  percent: number
}): CustomPriceRangeEntry[] {
  if (!entries.some((entry) => entry.id === entryId)) {
    return entries
  }

  const nextEntries = entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          liquidityPercent: clampCustomPriceRangeLiquidityPercent(percent),
        }
      : entry,
  )

  return rebalanceCustomPriceRangePercents(nextEntries, entryId)
}

export function updateCustomPriceRangeBounds({
  entries,
  entryId,
  bounds,
}: {
  entries: CustomPriceRangeEntry[]
  entryId: string
  bounds: Partial<Pick<CustomPriceRangeEntry, 'minPercentFromClearing' | 'maxPercentFromClearing'>>
}): CustomPriceRangeEntry[] {
  return entries.map((entry) => (entry.id === entryId ? { ...entry, ...bounds } : entry))
}

export function removeCustomPriceRangeEntry(
  entries: CustomPriceRangeEntry[],
  entryId: string,
): CustomPriceRangeEntry[] {
  if (entries.length <= 1) {
    return entries
  }

  const removedEntry = entries.find((entry) => entry.id === entryId)
  if (!removedEntry) {
    return entries
  }

  const nextEntries = entries.filter((entry) => entry.id !== entryId)
  const lastEntry = nextEntries[nextEntries.length - 1]!

  return nextEntries.map((entry) =>
    entry.id === lastEntry.id
      ? {
          ...entry,
          liquidityPercent: clampCustomPriceRangeLiquidityPercent(
            entry.liquidityPercent + removedEntry.liquidityPercent,
          ),
        }
      : entry,
  )
}

function isFiniteCustomPriceRangeValue(value: CustomPriceRangeValue): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidMinimumPriceRangeValue(value: CustomPriceRangeValue): boolean {
  return value === CustomPriceRangeBound.NegativeInfinity || isFiniteCustomPriceRangeValue(value)
}

function isValidMaximumPriceRangeValue(value: CustomPriceRangeValue): boolean {
  return value === CustomPriceRangeBound.PositiveInfinity || isFiniteCustomPriceRangeValue(value)
}

export function isCustomPriceRangeEntryValid(entry: CustomPriceRangeEntry): boolean {
  const { minPercentFromClearing, maxPercentFromClearing } = entry
  if (
    !isValidMinimumPriceRangeValue(minPercentFromClearing) ||
    !isValidMaximumPriceRangeValue(maxPercentFromClearing)
  ) {
    return false
  }

  if (isFiniteCustomPriceRangeValue(minPercentFromClearing) && isFiniteCustomPriceRangeValue(maxPercentFromClearing)) {
    return minPercentFromClearing < maxPercentFromClearing
  }

  return true
}

export function isCustomPriceRangeAllocationValid(entries: CustomPriceRangeEntry[]): boolean {
  return (
    entries.length > 0 &&
    entries.length <= MAX_CUSTOM_PRICE_RANGE_ENTRIES &&
    getCustomPriceRangeLiquidityTotal(entries) === 100 &&
    entries.every(isCustomPriceRangeEntryValid)
  )
}
