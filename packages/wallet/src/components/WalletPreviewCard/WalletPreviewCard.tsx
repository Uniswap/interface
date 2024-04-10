import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useAvatar, useDisplayName } from 'wallet/src/features/wallet/hooks'
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
const ICON_SIZE = 32

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  hideSelectionCircle,
  ...rest
}: Props): JSX.Element {
  const { avatar } = useAvatar(address)

  const displayName = useDisplayName(address, { showLocalName: true })
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
        <Flex
          row
          alignItems="center"
          gap="$spacing12"
          height={ADDRESS_WRAPPER_HEIGHT}
          justifyContent="flex-start">
          <AccountIcon address={address} avatarUri={avatar} size={ICON_SIZE} />
          <Flex alignItems="flex-start">
            <DisplayNameText displayName={displayName} textProps={{ variant: 'body1' }} />
            {balance ? (
              <Text color="$neutral2" variant="subheading2">
                {balanceFormatted}
              </Text>
            ) : null}
          </Flex>
        </Flex>
        {!hideSelectionCircle && selected && (
          <Icons.Check color="$accent1" size={iconSizes.icon20} />
        )}
      </Flex>
    </TouchableArea>
  )
}
