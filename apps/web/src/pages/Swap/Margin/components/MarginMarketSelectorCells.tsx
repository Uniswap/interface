import { Flex, Text } from '@universe/mycelium'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export const PAIR_LOGO_SIZE = 28
// One grid for the header and the pair rows, so their columns line up.
export const ROW_PADDING_X = '$spacing12'
export const MARK_PRICE_COL_WIDTH = 96
export const CHANGE_COL_WIDTH = 80
export const MAX_LEV_COL_WIDTH = 64
// Phone sheet: the 24h change stacks under the mark and the pair's max leverage moves under its name.
export const COMPACT_PRICE_COL_WIDTH = 96

export function columnGap(compact: boolean): '$spacing8' | '$spacing12' {
  return compact ? '$spacing8' : '$spacing12'
}

export function MarkPriceText({ mark }: { mark?: number }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <Text variant="body3" color="$neutral1" numberOfLines={1}>
      {mark !== undefined ? convertFiatAmountFormatted(mark, NumberType.FiatTokenPrice) : '—'}
    </Text>
  )
}

export function HeaderCell({ label, width }: { label: string; width: number }): JSX.Element {
  return (
    <Text width={width} flexShrink={0} textAlign="right" variant="body4" color="$neutral2" numberOfLines={1}>
      {label}
    </Text>
  )
}

export function PriceCells({
  mark,
  changePct,
  compact,
}: {
  mark?: number
  changePct?: number
  compact: boolean
}): JSX.Element {
  if (compact) {
    return (
      <Flex width={COMPACT_PRICE_COL_WIDTH} flexShrink={0} alignItems="flex-end">
        <MarkPriceText mark={mark} />
        <RelativeChange alignRight semanticColor change={changePct} variant="body3" />
      </Flex>
    )
  }
  return (
    <>
      <Flex width={MARK_PRICE_COL_WIDTH} flexShrink={0} alignItems="flex-end">
        <MarkPriceText mark={mark} />
      </Flex>
      <Flex width={CHANGE_COL_WIDTH} flexShrink={0} alignItems="flex-end">
        <RelativeChange alignRight semanticColor change={changePct} variant="body3" />
      </Flex>
    </>
  )
}
