import React from 'react'
import { Unicon } from 'src/components/unicons/Unicon'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { shortenAddress } from 'wallet/src/utils/addresses'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  name?: ElementName
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
  const { name: ensName } = useENS(ChainId.Mainnet, address)
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
      <Flex row alignItems="center" jc="space-between">
        <Flex row ai="center" gap="$spacing12" height={ADDRESS_WRAPPER_HEIGHT} jc="flex-start">
          <Unicon address={address} size={UNICON_SIZE} />
          <Flex ai="flex-start">
            <Text variant="body1">{ensName ?? shortenAddress(address)}</Text>
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
