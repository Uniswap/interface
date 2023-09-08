import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SelectionCircle } from 'src/components/input/SelectionCircle'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { ElementName } from 'src/features/telemetry/constants'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { ChainId } from 'wallet/src/constants/chains'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { useENS } from 'wallet/src/features/ens/useENS'
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

  const unselectedBorderColor = isDarkMode ? 'none' : 'surface3'

  return (
    <TouchableArea
      backgroundColor="surface2"
      borderColor={selected ? 'accent1' : unselectedBorderColor}
      borderRadius="rounded20"
      borderWidth={1}
      px="spacing16"
      py="spacing16"
      onPress={(): void => onSelect(address)}
      {...rest}>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex
          row
          alignItems="center"
          gap="spacing12"
          height={ADDRESS_WRAPPER_HEIGHT}
          justifyContent="flex-start">
          <Unicon address={address} size={UNICON_SIZE} />
          <Box>
            <Text variant="bodyLarge">{ensName ?? shortenAddress(address)}</Text>
            {balance ? (
              <Text color="neutral2" variant="subheadSmall">
                {formatUSDPrice(balance, NumberType.FiatTokenQuantity)}
              </Text>
            ) : null}
          </Box>
        </Flex>
        {!hideSelectionCircle && (
          <SelectionCircle selected={selected} size="icon16" unselectedColor="neutral2" />
        )}
      </Flex>
    </TouchableArea>
  )
}
