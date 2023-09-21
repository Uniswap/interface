import { useToastController } from '@tamagui/toast'
import { GestureResponderEvent } from 'react-native'
import { ColorTokens, Flex, Text, TouchableArea, Unicon } from 'ui/src'
import CheckIcon from 'ui/src/assets/icons/check.svg'
import CopyIcon from 'ui/src/assets/icons/copy-sheets.svg'
import { colorsDark, iconSizes } from 'ui/src/theme'
import { usePortfolioUSDBalance } from 'wallet/src/features/portfolio/hooks'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type AccountItemProps = {
  accentColor: ColorTokens
  address: Address
  selected: boolean
  onAccountSelect?: () => void
}

export function AccountItem({
  address,
  accentColor,
  selected,
  onAccountSelect,
}: AccountItemProps): JSX.Element {
  const { portfolioBalanceUSD, loading, error } = usePortfolioUSDBalance(address)
  const { show: showToast } = useToastController()
  const displayName = useDisplayName(address)?.name

  const copyAddress = async (e: GestureResponderEvent): Promise<void> => {
    await navigator.clipboard.writeText(address)
    showToast('Copied to clipboard', {
      native: false,
      duration: 3000,
      viewportName: 'popup',
    })
    e.stopPropagation()
  }

  return (
    <TouchableArea
      backgroundColor="$surface1"
      borderColor={selected ? accentColor : '$surface3'}
      borderRadius={16}
      borderWidth={1.5}
      cursor="pointer"
      flexDirection="row"
      gap="$spacing8"
      justifyContent="space-between"
      p="$spacing12"
      shadowColor="$surface3"
      shadowRadius={10}
      onPress={onAccountSelect}>
      <Flex grow gap="$spacing8">
        <Flex row>
          <Flex fill>
            <Unicon address={address} size={iconSizes.icon36} />
          </Flex>
          {selected && (
            <CheckIcon color={accentColor} height={iconSizes.icon20} width={iconSizes.icon20} />
          )}
        </Flex>
        <Flex>
          <Text color="$neutral1" variant="body1">
            {displayName}
          </Text>
          <Flex row>
            <Flex fill row space alignItems="center">
              <Text color="$neutral2" variant="body2">
                {sanitizeAddressText(shortenAddress(address))}
              </Text>
              <Flex onPress={copyAddress}>
                {/* TODO convert icon and remove dark mode color hardcoding */}
                <CopyIcon
                  color={colorsDark.neutral2}
                  height={iconSizes.icon12}
                  width={iconSizes.icon12}
                />
              </Flex>
            </Flex>
            <Text color="$neutral2" variant="body2">
              ${loading || error ? '' : portfolioBalanceUSD?.toFixed(2)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
