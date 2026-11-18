import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Fraction, Percent } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getExactSharePercent } from 'uniswap/src/features/positions/utils'
import { NumberType } from 'utilities/src/format/types'
import { MouseoverTooltip } from '~/components/Tooltip'
import { useLpIncentivesFormattedEarnings } from '~/features/Liquidity/hooks/useLpIncentivesFormattedEarnings'
import { LiquidityPositionAmountRows } from '~/features/Liquidity/LiquidityPositionAmountRows'
import { LiquidityPositionStackedBars } from '~/features/Liquidity/LiquidityPositionStackedBars'
import { usePositionRewardEarnings } from '~/features/Liquidity/LPIncentives/hooks/usePositionRewardEarnings'
import { useCurrencyInfo } from '~/hooks/currency/useCurrencyInfo'

// Wrap a backend-provided fee USD number as a CurrencyAmount so it flows through the same
// consumers (sum, share %, formatting) as the live-priced values it replaces. Denominated in a
// single fixed stablecoin (Mainnet USDC) so token0 and token1 fees share one currency — the value
// is chain-independent USD, and the UNI-rewards fiat value uses the same currency, so `.add()` and
// the percentage math stay consistent. LP-1616.
export function fiatFeeCurrencyAmount(usd: number | undefined): CurrencyAmount<Currency> | undefined {
  if (usd === undefined || !Number.isFinite(usd)) {
    return undefined
  }
  const stablecoin = getPrimaryStablecoin(UniverseChainId.Mainnet)
  return CurrencyAmount.fromRawAmount(stablecoin, Math.round(usd * 10 ** stablecoin.decimals))
}

export const SectionContainer = ({ children, testID }: { children: React.ReactNode; testID?: string }) => {
  return (
    <Flex
      p="$spacing20"
      backgroundColor="$surface2"
      width={380}
      $lg={{ width: '100%' }}
      borderRadius="$rounded16"
      gap="$spacing24"
      $platform-web={{
        height: 'min-content',
      }}
      testID={testID}
    >
      {children}
    </Flex>
  )
}

export const PositionSection = ({
  status,
  currency0Amount,
  currency1Amount,
  fiatValue0,
  fiatValue1,
}: {
  status?: PositionStatus
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatValue0: Maybe<CurrencyAmount<Currency>>
  fiatValue1: Maybe<CurrencyAmount<Currency>>
}) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { t } = useTranslation()
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  const totalFiatValue = fiatValue0?.add(fiatValue1 ?? CurrencyAmount.fromRawAmount(fiatValue0.currency, 0))
  const bars = useMemo(() => {
    const percent0 =
      totalFiatValue?.greaterThan(0) && fiatValue0 ? getExactSharePercent(fiatValue0, totalFiatValue) : undefined

    const percent1 =
      totalFiatValue?.greaterThan(0) && fiatValue1 ? getExactSharePercent(fiatValue1, totalFiatValue) : undefined

    if (!percent0 || !percent1 || !currencyInfo0 || !currencyInfo1) {
      return []
    }

    return [
      { id: currencyInfo0.currencyId, value: percent0, currencyInfo: currencyInfo0 },
      { id: currencyInfo1.currencyId, value: percent1, currencyInfo: currencyInfo1 },
    ]
  }, [currencyInfo0, currencyInfo1, fiatValue0, fiatValue1, totalFiatValue])

  const rows = useMemo(() => {
    if (!currencyInfo0 || !currencyInfo1) {
      return []
    }

    return [
      {
        currencyInfo: currencyInfo0,
        currencyAmount: currency0Amount,
        usdValue: toUsdValue(fiatValue0),
      },
      {
        currencyInfo: currencyInfo1,
        currencyAmount: currency1Amount,
        usdValue: toUsdValue(fiatValue1),
      },
    ]
  }, [currencyInfo0, currencyInfo1, currency0Amount, currency1Amount, fiatValue0, fiatValue1])

  return (
    <SectionContainer>
      <Flex gap="$gap8">
        <Text color="$neutral2" variant="body2">
          {t('pool.position')}
        </Text>
        {status === PositionStatus.CLOSED ? (
          <Text variant="heading2" $lg={{ variant: 'heading3' }}>
            {convertFiatAmountFormatted(0, NumberType.FiatTokenPrice)}
          </Text>
        ) : (
          <>
            <Text variant="heading2" mb="$spacing12">
              {fiatValue0 && fiatValue1 ? (
                convertFiatAmountFormatted(fiatValue0.add(fiatValue1).toExact(), NumberType.FiatTokenPrice)
              ) : (
                <MouseoverTooltip text={t('pool.positions.usdValueUnavailable.tooltip')} placement="right">
                  <Flex alignItems="center" row gap="$gap8">
                    <Text variant="body1" color="$neutral2">
                      {t('pool.positions.usdValueUnavailable')}
                    </Text>
                    <InfoCircleFilled color="$neutral2" size="$icon.16" />
                  </Flex>
                </MouseoverTooltip>
              )}
            </Text>
            {bars.length > 0 && (
              <Flex mb="$spacing24">
                <LiquidityPositionStackedBars bars={bars} />
              </Flex>
            )}
            {rows.length > 0 && <LiquidityPositionAmountRows rows={rows} />}
          </>
        )}
      </Flex>
    </SectionContainer>
  )
}

/**
 * A fiat `CurrencyAmount` reduced to the plain USD figure the earnings surfaces work in. Client-side
 * quotes land in whichever stablecoin priced them, and their decimals differ by chain, so the
 * amounts are compared and summed as USD rather than as quotients of mismatched scales.
 */
function toUsdValue(fiatValue: Maybe<CurrencyAmount<Currency>>): number | undefined {
  return fiatValue ? Number(fiatValue.toExact()) : undefined
}

// `Fraction` takes integers, so USD figures are scaled to sub-cent precision before becoming a ratio.
const EARNINGS_SHARE_SCALE = 1e6

/** A USD figure's share of the earnings total, or undefined when there's no share to draw. */
function toEarningsShare(value: number | undefined, total: number | undefined): Percent | undefined {
  if (!value || !total || value <= 0) {
    return undefined
  }
  // Rounding a sub-microdollar total to zero is what getExactSharePercent's non-positive guard is
  // for — it returns undefined rather than building a Percent that throws on the first toFixed.
  return getExactSharePercent(
    new Fraction(Math.round(value * EARNINGS_SHARE_SCALE), EARNINGS_SHARE_SCALE),
    new Fraction(Math.round(total * EARNINGS_SHARE_SCALE), EARNINGS_SHARE_SCALE),
  )
}

export const EarningsSection = ({
  positionInfo,
  currency0Amount,
  currency1Amount,
  fiatFeeValue0,
  fiatFeeValue1,
  fee0Amount,
  fee1Amount,
}: {
  positionInfo: PositionInfo
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatFeeValue0: Maybe<CurrencyAmount<Currency>>
  fiatFeeValue1: Maybe<CurrencyAmount<Currency>>
  fee0Amount?: CurrencyAmount<Currency>
  fee1Amount?: CurrencyAmount<Currency>
}) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { t } = useTranslation()

  const { rewardBalances, totalEarningsUsd, hasRewards, hasFees } = useLpIncentivesFormattedEarnings({
    liquidityPosition: positionInfo,
    fiatFeeValue0,
    fiatFeeValue1,
  })

  // TODO(WEB-4920): skip the token lookup once the backend provides image URLs.
  // Singular hook, twice, rather than the batched plural one: only this hook falls back to the
  // local common-base list, so a pool in ETH/USDT/USDC/DAI/WBTC/WETH still resolves its tokens
  // when the token gateway throttles the lookup. The plural hook is the network response alone,
  // and an empty one dropped both fee segments and the whole Fees breakdown while the reward rows
  // (which build their own CurrencyInfo) stayed — see PositionEarnings.e2e.test.ts. PositionSection
  // above resolves the same two currencies this way, so these calls dedupe with its.
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)

  const rewardEarnings = usePositionRewardEarnings(rewardBalances)

  const bars = useMemo(() => {
    // Each side contributes a segment only if it has a share to draw. Gating the whole bar on both
    // fee shares would drop every reward segment along with them, which is what a position with
    // rewards and freshly-collected fees hits.
    const feeShares = [
      { role: 'fee', value: toEarningsShare(toUsdValue(fiatFeeValue0), totalEarningsUsd), currencyInfo: currencyInfo0 },
      { role: 'fee', value: toEarningsShare(toUsdValue(fiatFeeValue1), totalEarningsUsd), currencyInfo: currencyInfo1 },
    ]

    // One segment per reward denomination. An unpriced reward has no share of the USD total to
    // draw, so it appears in the rows below but not in the bar.
    const rewardShares = rewardEarnings.map((earning) => ({
      role: 'reward',
      value: toEarningsShare(earning.usdValue, totalEarningsUsd),
      currencyInfo: earning.currencyInfo,
    }))

    // Keyed by role as well as token: a pool incentivized in one of its own tokens earns fees and
    // rewards in the same currency, and the two are distinct segments.
    return [...feeShares, ...rewardShares].flatMap(({ role, value, currencyInfo }) =>
      value && currencyInfo ? [{ id: `${role}-${currencyInfo.currencyId}`, value, currencyInfo }] : [],
    )
  }, [totalEarningsUsd, fiatFeeValue0, fiatFeeValue1, currencyInfo0, currencyInfo1, rewardEarnings])

  const feeRows = useMemo(() => {
    if (!currencyInfo0 || !currencyInfo1 || !fee0Amount || !fee1Amount) {
      return []
    }

    return [
      {
        currencyInfo: currencyInfo0,
        currencyAmount: fee0Amount,
        usdValue: toUsdValue(fiatFeeValue0),
      },
      {
        currencyInfo: currencyInfo1,
        currencyAmount: fee1Amount,
        usdValue: toUsdValue(fiatFeeValue1),
      },
    ]
  }, [currencyInfo0, currencyInfo1, fee0Amount, fee1Amount, fiatFeeValue0, fiatFeeValue1])

  return (
    <SectionContainer testID={TestID.PositionEarningsSection}>
      <Flex gap="$gap8">
        <Text color="$neutral2" variant="body2">
          {hasRewards ? t('pool.earnings') : t('common.feesEarned')}
        </Text>
        {positionInfo.status === PositionStatus.CLOSED ? (
          <Text variant="heading2">{convertFiatAmountFormatted(0, NumberType.FiatRewards)}</Text>
        ) : (
          <>
            <Text variant="heading2" mb="$spacing12">
              {totalEarningsUsd !== undefined ? (
                convertFiatAmountFormatted(totalEarningsUsd, NumberType.FiatRewards)
              ) : (
                <MouseoverTooltip text={t('pool.positions.usdValueUnavailable.tooltip')} placement="right">
                  <Flex alignItems="center" row gap="$gap8">
                    <Text variant="body1" color="$neutral2">
                      {t('pool.positions.usdValueUnavailable')}
                    </Text>
                    <InfoCircleFilled color="$neutral2" size="$icon.16" />
                  </Flex>
                </MouseoverTooltip>
              )}
            </Text>
            {bars.length > 0 && (
              <Flex mb="$spacing24">
                <LiquidityPositionStackedBars bars={bars} />
              </Flex>
            )}

            {hasRewards && rewardEarnings.length > 0 && (
              <>
                <Text color="$neutral2" variant="body2" mb="$spacing12">
                  {t('pool.rewards')}
                </Text>
                <LiquidityPositionAmountRows rows={rewardEarnings} />
              </>
            )}
            {hasFees && feeRows.length > 0 && (
              <>
                <Text color="$neutral2" variant="body2" mb="$spacing12" mt={hasRewards ? '$spacing24' : '$none'}>
                  {t('common.fees')}
                </Text>
                <LiquidityPositionAmountRows rows={feeRows} />
              </>
            )}

            {/* Rewards the backend couldn't price leave the total undefined while the rows above
                still show real earned amounts — "no earnings yet" under them would contradict them. */}
            {!totalEarningsUsd && !hasRewards && (
              <Text variant="body3" color="$neutral3">
                {t('pool.earnings.empty')}
              </Text>
            )}
          </>
        )}
      </Flex>
    </SectionContainer>
  )
}
