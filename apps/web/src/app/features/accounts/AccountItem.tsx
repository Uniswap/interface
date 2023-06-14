import { useToastController } from '@tamagui/toast'
import { GestureResponderEvent } from 'react-native'
import { Text, XStack, YStack } from 'ui'
import CheckIcon from 'ui/assets/icons/check.svg'
import CopyIcon from 'ui/assets/icons/copy-sheets.svg'
import { Flex } from 'ui/components/layout/Flex'
import { Unicon } from 'ui/components/Unicon'
import { colorsDark } from 'ui/theme/color'
import { iconSizes } from 'ui/theme/iconSizes'
import { usePortfolioUSDBalance } from 'wallet/src/features/portfolio/hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type AccountItemProps = {
  accentColor: string
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

  const copyAddress = (e: GestureResponderEvent): void => {
    navigator.clipboard.writeText(address)
    showToast('Copied to clipboard', {
      native: false,
      duration: 3000,
    })
    e.stopPropagation()
  }

  return (
    <XStack
      backgroundColor="rgba(255, 255, 255, 0.075)"
      borderColor={accentColor}
      borderRadius={16}
      borderWidth={selected ? 1 : 0}
      gap="$spacing8"
      justifyContent="space-between"
      marginBottom="$spacing12"
      marginHorizontal="$spacing12"
      padding="$spacing12"
      onPress={onAccountSelect}>
      <YStack flexGrow={1}>
        <XStack>
          <Flex flex={1}>
            <Unicon address={address} size={iconSizes.icon36} />
          </Flex>
          {selected && (
            <CheckIcon color={accentColor} height={iconSizes.icon20} width={iconSizes.icon20} />
          )}
        </XStack>
        <Flex>
          <Text color="$textPrimary" variant="bodySmall">
            {/* TODO get name, relies on ENS and as a result rtk-query */}
            {sanitizeAddressText(shortenAddress(address))}
          </Text>
          <XStack>
            <XStack space alignItems="center" flex={1}>
              <Text color="$textSecondary" variant="bodySmall">
                {sanitizeAddressText(shortenAddress(address))}
              </Text>
              <Flex onPress={copyAddress}>
                <CopyIcon
                  color={colorsDark.textSecondary}
                  height={iconSizes.icon12}
                  width={iconSizes.icon12}
                />
              </Flex>
            </XStack>
            <Text color="$textSecondary" variant="bodySmall">
              ${loading || error ? '' : portfolioBalanceUSD?.toFixed(2)}
            </Text>
          </XStack>
        </Flex>
      </YStack>
    </XStack>
  )
}
