import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { useENSAvatar } from 'src/features/ens/api'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { formatUSDPrice, NumberType } from 'src/utils/format'

type AccountCardItemProps = {
  address: Address
  isActive?: boolean
  isViewOnly: boolean
  onPress: (address: Address) => void
  onPressEdit: (address: Address) => void
} & PortfolioValueProps

type PortfolioValueProps = {
  isPortfolioValueLoading: boolean
  portfolioValue: number | undefined
}

function PortfolioValue({
  isPortfolioValueLoading,
  portfolioValue,
}: PortfolioValueProps): JSX.Element {
  const isLoading = isPortfolioValueLoading && portfolioValue === undefined

  return (
    <DecimalNumber
      color="textSecondary"
      loading={isLoading}
      number={formatUSDPrice(portfolioValue, NumberType.PortfolioBalance)}
      variant="bodySmall"
    />
  )
}

export function AccountCardItem({
  address,
  isViewOnly,
  isActive,
  isPortfolioValueLoading,
  portfolioValue,
  onPress,
  onPressEdit,
}: AccountCardItemProps): JSX.Element {
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)
  const hasNotifications = useSelectAddressHasNotifications(address)

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showViewOnlyBadge={isViewOnly}
        size={iconSizes.xxxl}
      />
    )
  }, [address, avatar, isViewOnly])

  return (
    <TouchableArea hapticFeedback pb="sm" pt="xs" px="lg" onPress={(): void => onPress(address)}>
      <Flex row alignItems="center" testID={`account_item/${address}`}>
        <Flex row shrink alignItems="center">
          <NotificationBadge showIndicator={hasNotifications}>{icon}</NotificationBadge>
          <Flex fill gap="none">
            <Text numberOfLines={1} variant="bodyLarge">
              {displayName?.name}
            </Text>
            <PortfolioValue
              isPortfolioValueLoading={isPortfolioValueLoading}
              portfolioValue={portfolioValue}
            />
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="none">
          {isActive && (
            <Check
              color={theme.colors.userThemeMagenta}
              height={theme.iconSizes.md}
              width={theme.iconSizes.md}
            />
          )}
          <TouchableArea
            name={ElementName.Edit}
            pl="sm"
            py="md"
            onPress={(): void => onPressEdit(address)}>
            <TripleDots
              color={theme.colors.textTertiary}
              height={iconSizes.xs}
              strokeLinecap="round"
              strokeWidth="1"
              width={iconSizes.sm}
            />
          </TouchableArea>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
