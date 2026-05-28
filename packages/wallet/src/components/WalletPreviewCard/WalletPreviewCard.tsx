import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  name?: ElementName
  testID?: string
  hideSelectionCircle?: boolean
}

// Some preview cards do not have a name (no unitag), so we need to set a minimal height to keep their height consistent.
export const WALLET_PREVIEW_CARD_MIN_HEIGHT = 72

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  hideSelectionCircle,
  ...rest
}: Props): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const balanceFormatted = convertFiatAmountFormatted(balance, NumberType.FiatTokenQuantity)

  return (
    <TouchableArea
      backgroundColor={selected ? '$surface1' : '$surface2'}
      borderColor={selected ? '$surface3' : '$surface2'}
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      minHeight={WALLET_PREVIEW_CARD_MIN_HEIGHT}
      p="$spacing12"
      shadowColor={selected ? '$shadowColor' : '$transparent'}
      shadowOpacity={0.05}
      shadowRadius={selected ? '$spacing8' : '$none'}
      onPress={(): void => onSelect(address)}
      {...rest}
    >
      <Flex fill row alignContent="center" alignItems="center" justifyContent="space-between">
        <AddressDisplay address={address} captionVariant="body2" size={iconSizes.icon36} />
        <Flex row gap="$spacing8" px="$spacing4" pl="$spacing12">
          {Boolean(balance) && (
            <Text color="$neutral2" variant="body3">
              {balanceFormatted}
            </Text>
          )}
          {!hideSelectionCircle && selected && <Check strokeWidth={6} color="$accent1" size="$icon.20" />}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
