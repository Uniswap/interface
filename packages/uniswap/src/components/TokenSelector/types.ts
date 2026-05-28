import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FiatNumberType } from 'utilities/src/format/types'

// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
export type OnSelectCurrency = (
  currency: CurrencyInfo,
  section: OnchainItemSection<TokenSelectorOption>,
  index: number,
) => void

export type TokenSectionsHookProps = {
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  oppositeSelectedToken?: TradeableAsset
}

// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
export type ConvertFiatAmountFormattedCallback = (
  fromAmount: Maybe<string | number>,
  numberType: FiatNumberType,
  // oxlint-disable-next-line typescript/no-duplicate-type-constituents -- biome-parity: oxlint is stricter here
  placeholder?: string | undefined,
) => string

export enum TokenSelectorFlow {
  Swap = 0,
  Send = 1,
  Liquidity = 2,
  Limit = 3,
}

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // Swap input and output sections specced in 'Multichain UX: Token Selector and Swap' doc on Notion
  SwapInput = 'swap-input', // balances, recent searches, favorites, popular
  SwapOutput = 'swap-output', // suggested bases, balances, recent searches, favorites, popular
}
