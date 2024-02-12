import React from 'react'
import { SelectionCircle } from 'src/components/input/SelectionCircle'
import { Unicon } from 'src/components/unicons/Unicon'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Text, TouchableArea } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { ChainId } from 'wallet/src/constants/chains'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
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
  const isDarkMode = useIsDarkMode()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const balanceFormatted = convertFiatAmountFormatted(balance, NumberType.FiatTokenQuantity)
  const unselectedBorderColor = isDarkMode ? '$transparent' : '$surface3'

  return (
    <TouchableArea
      backgroundColor="$surface2"
      borderColor={selected ? '$accent1' : unselectedBorderColor}
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
        {!hideSelectionCircle && (
          <SelectionCircle selected={selected} size="icon16" unselectedColor="$neutral2" />
        )}
      </Flex>
    </TouchableArea>
  )
}
