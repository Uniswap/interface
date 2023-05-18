import { SwitchNetworksModal } from 'src/features/home/SwitchNetworksModal'
import { Popover, XStack } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe.svg'
import SettingsIcon from 'ui/src/assets/icons/settings.svg'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { Unicon } from 'ui/src/components/Unicon'
import { colors } from 'ui/src/theme/color'
import { iconSize } from 'ui/src/theme/tokens'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type PortfolioHeaderProps = {
  address: Address
  onLockPress?: () => void
}

export function PortfolioHeader({ address }: PortfolioHeaderProps): JSX.Element {
  return (
    <XStack alignItems="center" justifyContent="space-between" padding="$spacing16">
      <Flex alignItems="center" flexDirection="row" gap="$spacing8" justifyContent="center">
        <Unicon address={address} size={iconSize.icon36} />
        <Text variant="subheadSmall">{sanitizeAddressText(shortenAddress(address))}</Text>
      </Flex>
      <XStack alignItems="center" gap="$spacing16" justifyContent="space-around">
        <Popover>
          <Popover.Trigger>
            <GlobeIcon color={colors.gray200} height={iconSize.icon24} width={iconSize.icon24} />
          </Popover.Trigger>
          <Popover.Content borderRadius="$rounded12">
            <SwitchNetworksModal />
          </Popover.Content>
        </Popover>
        <Popover>
          <Popover.Trigger>
            <SettingsIcon color={colors.gray200} height={iconSize.icon28} width={iconSize.icon28} />
          </Popover.Trigger>
        </Popover>
      </XStack>
    </XStack>
  )
}
