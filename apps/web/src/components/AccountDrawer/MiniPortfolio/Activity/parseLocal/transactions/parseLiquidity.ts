import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type {
  CollectFeesTransactionInfo,
  LpIncentivesClaimTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getCurrencyFromCurrencyId } from '~/components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import { buildCurrencyDescriptor } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/utils'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

type GenericLiquidityInfo = Omit<LiquidityIncreaseTransactionInfo | LiquidityDecreaseTransactionInfo, 'type'>

async function parseCurrencyInfoForLP({
  currencyInfo,
  formatNumber,
}: {
  currencyInfo: {
    currency0Id: string
    currency1Id?: string
    currency0AmountRaw: string
    currency1AmountRaw?: string
  }
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [currency0, currency1] = await Promise.all([
    getCurrencyFromCurrencyId(currencyInfo.currency0Id),
    currencyInfo.currency1Id ? getCurrencyFromCurrencyId(currencyInfo.currency1Id) : undefined,
  ])

  const descriptor = buildCurrencyDescriptor({
    currencyA: currency0,
    amtA: currencyInfo.currency0AmountRaw,
    currencyB: currency1,
    amtB: currencyInfo.currency1AmountRaw ?? '0',
    formatNumber,
  })

  return { descriptor, currencies: [currency0, currency1] }
}

export async function parseCollectFees({
  collectInfo,
  formatNumber,
}: {
  collectInfo: CollectFeesTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  return parseCurrencyInfoForLP({
    currencyInfo: collectInfo,
    formatNumber,
  })
}

export async function parseMigrateV2ToV3({
  baseCurrencyId,
  quoteCurrencyId,
}: MigrateV2LiquidityToV3TransactionInfo): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrencyFromCurrencyId(baseCurrencyId),
    getCurrencyFromCurrencyId(quoteCurrencyId),
  ])
  const baseSymbol = baseCurrency?.symbol ?? i18n.t('common.unknown')
  const quoteSymbol = quoteCurrency?.symbol ?? i18n.t('common.unknown')
  const descriptor = i18n.t('activity.transaction.tokens.descriptor', {
    amountWithSymbolA: baseSymbol,
    amountWithSymbolB: quoteSymbol,
  })

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

export async function parseLpIncentivesClaim({
  info,
  chainId,
}: {
  info: LpIncentivesClaimTransactionInfo
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const token = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, info.tokenAddress))
  const symbol = token?.symbol ?? i18n.t('common.unknown')
  return {
    descriptor: i18n.t('activity.transaction.lpRewards.descriptor', { symbol }),
    currencies: [token],
  }
}

export async function parseLiquidity({
  lp,
  formatNumber,
}: {
  lp: GenericLiquidityInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [token0Currency, token1Currency] = await Promise.all([
    getCurrencyFromCurrencyId(lp.currency0Id),
    getCurrencyFromCurrencyId(lp.currency1Id),
  ])
  const [token0Raw, token1Raw] = [lp.currency0AmountRaw, lp.currency1AmountRaw]
  const descriptor = buildCurrencyDescriptor({
    currencyA: token0Currency,
    amtA: token0Raw,
    currencyB: token1Currency,
    amtB: token1Raw,
    formatNumber,
  })

  return { descriptor, currencies: [token0Currency, token1Currency] }
}
