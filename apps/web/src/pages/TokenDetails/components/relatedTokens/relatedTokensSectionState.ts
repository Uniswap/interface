import type { TFunction } from 'i18next'
import { getRelatedTokensTitle } from 'uniswap/src/features/tokenCategories/getRelatedTokensTitle'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import {
  deriveRelatedSectionState,
  type RelatedSectionState,
  selectRelatedCategory,
} from '~/components/TokenCardCarousel/relatedSectionState'

export type RelatedTokensSectionState = RelatedSectionState<TokenCategory>

export const selectRelatedTokensCategory = selectRelatedCategory<TokenCategory>

export function deriveRelatedTokensSectionState({
  categories,
  pickedCategoryId,
  isLoading,
  isError,
  tokenCount,
  t,
}: {
  categories: TokenCategory[]
  pickedCategoryId: string | undefined
  isLoading: boolean
  isError: boolean
  tokenCount: number
  t: TFunction
}): RelatedTokensSectionState | undefined {
  return deriveRelatedSectionState({
    categories,
    pickedCategoryId,
    isLoading,
    isError,
    itemCount: tokenCount,
    headerTitle: t('tdp.relatedTokens.header'),
    singleTitle: (category) => getRelatedTokensTitle({ t, category }),
  })
}
