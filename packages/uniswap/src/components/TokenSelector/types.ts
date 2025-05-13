import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatNumberType } from 'utilities/src/format/types'

export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: OnchainItemSection<TokenSelectorOption>,
  index: number,
) => void

export type TokenSectionsHookProps = {
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  oppositeSelectedToken?: TradeableAsset
  isKeyboardOpen?: boolean
}

export type ConvertFiatAmountFormattedCallback = (
  fromAmount: Maybe<string | number>,
  numberType: FiatNumberType,
  placeholder?: string | undefined,
) => string

export enum TokenSelectorFlow {
  Swap = 0,
  Send = 1,
}
