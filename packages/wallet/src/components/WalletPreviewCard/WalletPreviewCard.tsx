import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { ElementNameType } from 'wallet/src/telemetry/constants'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  name?: ElementNameType
  testID?: string
  hideSelectionCircle?: boolean
}

export const ADDRESS_WRAPPER_HEIGHT = 36

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
      borderWidth={1}
      px="$spacing16"
      py="$spacing16"
      onPress={(): void => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <AddressDisplay address={address} captionVariant="body2" size={iconSizes.icon36} />
        <Flex row gap="$spacing8">
          {Boolean(balance) && (
            <Text color="$neutral3" variant="body3">
              {balanceFormatted}
            </Text>
          )}
          {!hideSelectionCircle && selected && <Check color="$accent1" size={iconSizes.icon20} />}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
