import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { MARGIN_CHAIN_ID } from '~/constants/margin'

// `static` = the position's own collateral: always on the margin chain, no network badge.
// `select` opens the payment-token selector and keeps the badge — a pay token may be on another chain.
export type MarginAmountFieldChip =
  | { kind: 'static'; symbol: string; logoUrl?: string }
  | { kind: 'select'; symbol: string; logoUrl?: string; chainId: number; ariaLabel: string; onPress: () => void }

// Right-hand affordance on the USD-caption row: a tappable max, or plain text.
export type MarginAmountFieldTrailing =
  | { kind: 'action'; label: string; ariaLabel: string; onPress: () => void }
  | { kind: 'text'; label: string }

function MarginAmountFieldChipView({ chip }: { chip: MarginAmountFieldChip }): JSX.Element {
  if (chip.kind === 'static') {
    return (
      <Flex
        row
        alignItems="center"
        gap="$spacing6"
        px="$spacing8"
        py="$spacing6"
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
      >
        <TokenLogo size={24} url={chip.logoUrl} symbol={chip.symbol} chainId={MARGIN_CHAIN_ID} hideNetworkLogo />
        <Text variant="buttonLabel3" color="$neutral1">
          {chip.symbol}
        </Text>
      </Flex>
    )
  }
  return (
    <TouchableArea
      px="$spacing8"
      py="$spacing6"
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      aria-label={chip.ariaLabel}
      onPress={chip.onPress}
    >
      <Flex row alignItems="center" gap="$spacing6">
        <TokenLogo size={24} url={chip.logoUrl} symbol={chip.symbol} chainId={chip.chainId} />
        <Text variant="buttonLabel3" color="$neutral1">
          {chip.symbol}
        </Text>
        <RotatableChevron direction="down" size="$icon.16" color="$neutral2" />
      </Flex>
    </TouchableArea>
  )
}

// Margin amount card: amount + token chip, an optional USD caption with an optional trailing max,
// and an optional full-width helper line. Every caption is pre-formatted by the caller.
export function MarginAmountField({
  label,
  value,
  onChangeText,
  maxDecimals,
  inputAriaLabel,
  chip,
  usdCaption,
  trailing,
  helperCaption,
}: {
  label?: string
  value: string
  onChangeText: (text: string) => void
  maxDecimals: number
  inputAriaLabel: string
  chip: MarginAmountFieldChip
  usdCaption?: string
  trailing?: MarginAmountFieldTrailing
  helperCaption?: string
}): JSX.Element {
  return (
    <Flex gap="$spacing8" p="$spacing16" borderRadius="$rounded20" backgroundColor="$surface2">
      {label ? (
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      ) : null}
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
        <AmountInput
          value={value}
          onChangeText={onChangeText}
          placeholder="0"
          maxDecimals={maxDecimals}
          aria-label={inputAriaLabel}
          flex={1}
          backgroundColor="$transparent"
          borderWidth="$none"
          color="$neutral1"
          px="$none"
          py="$none"
          fontFamily="$heading"
          fontSize={fonts.heading2.fontSize}
          fontWeight={fonts.heading2.fontWeight}
          lineHeight={fonts.heading2.lineHeight}
        />
        <MarginAmountFieldChipView chip={chip} />
      </Flex>
      {usdCaption !== undefined || trailing ? (
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
          <Text variant="body3" color="$neutral2">
            {usdCaption ?? ''}
          </Text>
          {trailing?.kind === 'action' ? (
            <TouchableArea aria-label={trailing.ariaLabel} onPress={trailing.onPress}>
              <Text variant="body3" color="$neutral2">
                {trailing.label}
              </Text>
            </TouchableArea>
          ) : trailing ? (
            <Text variant="body3" color="$neutral2">
              {trailing.label}
            </Text>
          ) : null}
        </Flex>
      ) : null}
      {helperCaption ? (
        <Text variant="body4" color="$neutral3">
          {helperCaption}
        </Text>
      ) : null}
    </Flex>
  )
}
