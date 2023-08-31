import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SwitchNetworksModal } from 'src/app/features/home/SwitchNetworksModal'
import { AppRoutes } from 'src/app/navigation/constants'
import { useDappContext } from 'src/background/features/dapp/hooks'
import { Icons, Popover, Text, TouchableArea, Unicon, XStack } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

type PortfolioHeaderProps = {
  address: Address
}

export function PortfolioHeader({ address }: PortfolioHeaderProps): JSX.Element {
  const navigate = useNavigate()

  const displayName = useDisplayName(address)?.name

  const onPressAccount = (): void => {
    navigate(AppRoutes.AccountSwitcher)
  }

  // Value does not matter, only used as a trigger to re-render the component when the dapp connection status changes
  const [updateConnectionStatus, setUpdateConnectionStatus] = useState(false)
  const { dappConnected } = useDappContext(undefined, updateConnectionStatus)

  return (
    <XStack alignItems="center" justifyContent="space-between">
      <XStack
        alignItems="center"
        borderRadius="$rounded24"
        cursor="pointer"
        flexDirection="row"
        gap="$spacing8"
        justifyContent="center"
        onPress={onPressAccount}>
        <Unicon address={address} size={iconSizes.icon36} />
        <XStack gap="$spacing4" paddingVertical="$spacing16">
          <Text variant="subheadSmall">{displayName}</Text>
          <Icons.Chevron
            color="$neutral2"
            direction="s"
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </XStack>
      </XStack>
      <XStack alignItems="center" gap="$spacing16" justifyContent="space-around">
        {dappConnected ? (
          <Popover placement="left-start">
            <Popover.Trigger
              onTouchEnd={(): void => setUpdateConnectionStatus(!updateConnectionStatus)}>
              <Icons.Globe color="$neutral2" height={iconSizes.icon20} width={iconSizes.icon20} />
            </Popover.Trigger>
            <Popover.Content
              borderColor="$surface2"
              borderRadius="$rounded12"
              borderWidth={1}
              paddingLeft="$spacing4">
              <SwitchNetworksModal />
            </Popover.Content>
          </Popover>
        ) : null}
        <TouchableArea onPress={(): void => navigate('/settings')}>
          <Icons.Settings color="$neutral2" height={iconSizes.icon24} width={iconSizes.icon24} />
        </TouchableArea>
      </XStack>
    </XStack>
  )
}
