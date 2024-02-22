import React from 'react'
import { Flex, Icons, Text, TouchableArea, Unicon, UniconV2 } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
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
const UNICON_SIZE = 32

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  hideSelectionCircle,
  ...rest
}: Props): JSX.Element {
  const isUniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)

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
          {isUniconsV2Enabled ? (
            <UniconV2 address={address} size={UNICON_SIZE} />
          ) : (
            <Unicon address={address} size={UNICON_SIZE} />
          )}
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
