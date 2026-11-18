import { areEvmAddressesEqual } from '@universe/chains'
import { Text } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useTranslation } from 'react-i18next'
import { useMarginFormStoreActions } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import type { MarginMarket, MarginPairGroup } from '~/constants/margin'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { getMarginDirectionStyle } from '~/features/margin/utils/marginFormat'
import { marginMarketDirection, marginPairLegs } from '~/features/margin/utils/marginTokenDisplay'

// A side switch lands on the same pair the other way round, else the same base against another quote.
export function findMarginSideCounterpart(
  groups: MarginPairGroup[],
  { market, direction }: { market: MarginMarket; direction: MarginDirection },
): MarginPairGroup | undefined {
  const { base, quote } = marginPairLegs(market)
  const sameBase = groups.filter((g) => g.direction === direction && areEvmAddressesEqual(g.base.address, base.address))
  return sameBase.find((g) => areEvmAddressesEqual(g.quote.address, quote.address)) ?? sameBase.at(0)
}

// Long/short are different pairs, so a switch switches pair. A side the base can't trade is disabled,
// not hidden (nothing is disabled before markets load), so the control never resizes.
export function MarginFormSideToggle({ market }: { market: MarginMarket }): JSX.Element {
  const { t } = useTranslation()
  const { groups } = useMarginMarkets()
  const { setMarginFormState } = useMarginFormStoreActions()
  const selected =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  const options = [MarginDirection.LONG, MarginDirection.SHORT].map((direction) => {
    const disabled =
      groups.length > 0 && direction !== selected && !findMarginSideCounterpart(groups, { market, direction })
    const color = disabled
      ? '$neutral3'
      : direction === selected
        ? getMarginDirectionStyle(direction).color
        : '$neutral2'
    const label = direction === MarginDirection.LONG ? t('margin.side.long') : t('margin.side.short')
    return {
      value: direction,
      disabled,
      display: (
        <Text variant="buttonLabel3" color={color}>
          {label}
        </Text>
      ),
    }
  })
  const onSelect = (direction: MarginDirection): void => {
    const target = findMarginSideCounterpart(groups, { market, direction })
    if (direction !== selected && target) {
      // The amount was in the old pay token's units; the form re-enters its fiat figure (depositFiat).
      setMarginFormState({
        pairKey: target.pairKey,
        side: direction,
        paymentToken: undefined,
        pinnedVenue: undefined,
        marginAmount: '',
      })
    }
  }
  return (
    <SegmentedControl
      options={options}
      selectedOption={selected}
      onSelectOption={onSelect}
      size="large"
      fullWidth
      indicatorColor={getMarginDirectionStyle(selected).backgroundColor}
    />
  )
}
