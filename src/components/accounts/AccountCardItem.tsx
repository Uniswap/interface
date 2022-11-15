import React, { useMemo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { NotificationBadge } from 'src/components/notifications/Badge'
import { Text } from 'src/components/Text'
import { DecimalNumber } from 'src/components/text/DecimalNumber'
import { PollingInterval } from 'src/constants/misc'
import { usePortfolioBalanceQuery } from 'src/data/__generated__/types-and-hooks'
import { useENSAvatar } from 'src/features/ens/api'
import { useSelectAddressHasNotifications } from 'src/features/notifications/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Account } from 'src/features/wallet/accounts/types'
import { useDisplayName } from 'src/features/wallet/hooks'
import { iconSizes } from 'src/styles/sizing'
import { formatUSDPrice, NumberType } from 'src/utils/format'

interface Props {
  account: Account
  isActive?: boolean
  isViewOnly: boolean
  onPress?: (address: Address) => void
  onPressEdit?: (address: Address) => void
}

function PortfolioBalance({ owner }: { owner: Address }) {
  const theme = useAppTheme()

  const { data, loading } = usePortfolioBalanceQuery({
    variables: { owner },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
  })

  if (loading && !data) {
    return <Loading height={theme.textVariants.bodySmall.lineHeight} type="text" />
  }

  return (
    <DecimalNumber
      color="textSecondary"
      number={formatUSDPrice(
        data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value ?? undefined,
        NumberType.FiatTokenQuantity
      )}
      variant="bodySmall"
    />
  )
}

export function AccountCardItem({ account, isViewOnly, isActive, onPress, onPressEdit }: Props) {
  const { address } = account
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
        size={iconSizes.xl}
      />
    )
  }, [address, avatar, isViewOnly])

  return (
    <TouchableArea hapticFeedback pb="sm" pt="xs" px="lg" onPress={() => onPress?.(address)}>
      <Flex row alignItems="center" testID={`account_item/${address.toLowerCase()}`}>
        <Flex row shrink alignItems="center">
          <NotificationBadge showIndicator={hasNotifications}>{icon}</NotificationBadge>
          <Flex fill gap="none">
            <Text numberOfLines={1} variant="bodyLarge">
              {displayName?.name}
            </Text>
            <PortfolioBalance owner={address} />
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="xs">
          {isActive && (
            <Check
              color={theme.colors.userThemeMagenta}
              height={theme.iconSizes.md}
              width={theme.iconSizes.md}
            />
          )}
          {onPressEdit && (
            <TouchableArea name={ElementName.Edit} onPress={() => onPressEdit(address)}>
              <TripleDots
                color={theme.colors.textTertiary}
                height={iconSizes.xs}
                strokeLinecap="round"
                strokeWidth="1"
                width={iconSizes.sm}
              />
            </TouchableArea>
          )}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
