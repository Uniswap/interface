import type { TFunction } from 'i18next'
import { useEffect } from 'react'
import type { GeneratedIcon } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'
import { Ranking } from 'ui/src/components/icons/Ranking'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

/**
 * Categories spotlit as chips after All by default; the remainder live in the More dropdown.
 * The spotlit set is the head of the ordered list minus empty categories, so the per-kind order Statsig
 * config controls both which categories get a chip and their order.
 */
const SPOTLIT_CHIP_COUNT = 4

export interface ExploreCategoryChipOption {
  id: string
  label: string
  icon?: GeneratedIcon
  category?: Category
}

function toChipOption(category: Category): ExploreCategoryChipOption {
  return { id: category.id, label: category.name, icon: getCategoryIcon(category), category }
}

export function getAllChipOption(t: TFunction): ExploreCategoryChipOption {
  return { id: ExploreCategory.All, label: t('common.all'), icon: Ranking }
}

type IsCategoryEmpty = (category: Category) => boolean

function getSpotlitCategories<T extends Category>(categories: T[], isCategoryEmpty: IsCategoryEmpty): T[] {
  return categories.filter((category) => !isCategoryEmpty(category)).slice(0, SPOTLIT_CHIP_COUNT)
}

/** Ids in the default chip row (All + spotlit head); a selection outside this set claims the flex slot. */
function getSpotlitCategoryIds(categories: Category[], isCategoryEmpty: IsCategoryEmpty): ReadonlySet<string> {
  return new Set<string>([
    ExploreCategory.All,
    ...getSpotlitCategories(categories, isCategoryEmpty).map((category) => category.id),
  ])
}

/**
 * Remembers the most recent non-spotlit selection so the flex slot keeps showing it after moving
 * back to a spotlit category, only ceding the slot to the next non-spotlit selection. Kept in the
 * Explore filter store rather than local state so it outlives the chip row's remount on a tab switch.
 * Keyed per kind so a pick on one tab never lands in the other tab's row.
 */
export function useFlexSlotCategoryId({
  kind,
  categories,
  selectedCategoryId,
  isCategoryEmpty,
}: {
  kind: CategoryKind
  categories: Category[]
  selectedCategoryId: string
  isCategoryEmpty: IsCategoryEmpty
}): string | undefined {
  const flexSlotCategoryId = useExploreTablesFilterStore((s) => s.flexSlotCategoryIds[kind])
  const { setFlexSlotCategoryId } = useExploreTablesFilterStoreActions()
  useEffect(() => {
    if (!getSpotlitCategoryIds(categories, isCategoryEmpty).has(selectedCategoryId)) {
      setFlexSlotCategoryId({ kind, categoryId: selectedCategoryId })
    }
  }, [kind, categories, isCategoryEmpty, selectedCategoryId, setFlexSlotCategoryId])
  return flexSlotCategoryId
}

/** The pre-token-categories chip set: the flag-off render, and the fallback when ListCategories fails or is empty. */
export function getStaticCategoryChipOptions(t: TFunction): ExploreCategoryChipOption[] {
  return [
    getAllChipOption(t),
    { id: ExploreCategory.Stocks, label: t('common.stocks'), icon: Briefcase },
    { id: ExploreCategory.Commodities, label: t('common.commodities'), icon: Nut },
    { id: ExploreCategory.Etfs, label: t('common.etfs'), icon: Etf },
  ]
}

/**
 * Chip options from the fetched category list: All first (default, not a BE category), then the
 * spotlit head of the ordered list. The last spotlit slot is a flex slot: a non-spotlit selection
 * (deep link or the More dropdown) takes it over, and `flexSlotCategoryId` keeps the most recent one
 * there after moving back to a spotlit category, so the row always shows the same number of chips.
 * An empty category only gets a chip while selected, so a deep link to one still has an active chip.
 */
export function deriveCategoryChipOptions({
  kind,
  categories,
  selectedCategoryId,
  flexSlotCategoryId,
  isCategoryEmpty,
  t,
}: {
  kind: CategoryKind
  categories: Category[]
  selectedCategoryId?: string
  /** The most recent non-spotlit selection (see useFlexSlotCategoryId). */
  flexSlotCategoryId?: string
  isCategoryEmpty: IsCategoryEmpty
  t: TFunction
}): ExploreCategoryChipOption[] {
  const options = [getAllChipOption(t), ...getSpotlitCategories(categories, isCategoryEmpty).map(toChipOption)]

  // The current selection wins the flex slot over the persisted id so the active category always has a chip.
  for (const candidateId of [selectedCategoryId, flexSlotCategoryId]) {
    if (candidateId === undefined || options.some((option) => option.id === candidateId)) {
      continue
    }
    const fetched = categories.find((category) => category.id === candidateId)
    if (fetched && candidateId !== selectedCategoryId && isCategoryEmpty(fetched)) {
      continue
    }
    // Static token ids stay valid deep links even when the response omits them, so the selected chip
    // must fall back to the static option rather than leaving the row with no active chip.
    const fallback =
      kind === 'token' ? getStaticCategoryChipOptions(t).find((option) => option.id === candidateId) : undefined
    const candidate = fetched ? toChipOption(fetched) : fallback
    if (candidate) {
      if (options.length <= SPOTLIT_CHIP_COUNT) {
        options.push(candidate)
      } else if (options[options.length - 1]?.id !== selectedCategoryId) {
        // A persisted id never displaces the selected chip when the selection holds the last slot.
        options[options.length - 1] = candidate
      }
      break
    }
  }

  return options
}
