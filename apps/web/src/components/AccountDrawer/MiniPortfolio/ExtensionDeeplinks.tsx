import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useOpenLimitOrders, usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { Pool } from 'components/Icons/Pool'
import { ExtensionRequestMethods, useUniswapExtensionRequest } from 'components/WalletModal/useWagmiConnectorWithId'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { ArrowRightToLine } from 'ui/src/components/icons/ArrowRightToLine'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'

const UnreadIndicator = () => {
  const colors = useSporeColors()

  return (
    <Flex position="absolute" left="60%">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill={colors.accent1.val} stroke={colors.surface1.val} strokeWidth="2px" />
      </svg>
    </Flex>
  )
}

const DeepLinkButton = ({ Icon, Label, onPress }: { Icon: JSX.Element; Label: string; onPress: () => void }) => {
  return (
    <Button justifyContent="flex-start" fill={false} emphasis="tertiary" onPress={onPress}>
      <Flex row alignItems="flex-start" gap="$spacing12">
        <Flex row>{Icon}</Flex>
        <Button.Text>{Label}</Button.Text>
      </Flex>
      <Flex row flexGrow={1} justifyContent="flex-end">
        <Button.Icon typeOfButton="button" emphasis="tertiary">
          <RotatableChevron direction="right" />
        </Button.Icon>
      </Flex>
    </Button>
  )
}

export function ExtensionDeeplinks({ account }: { account: string }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const uniswapExtensionRequest = useUniswapExtensionRequest()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()
  const { openLimitOrders } = useOpenLimitOrders(account)

  const [activityUnread, setActivityUnread] = useState(false)
  const { hasPendingActivity } = usePendingActivity()
  useEffect(() => {
    if (hasPendingActivity) {
      setActivityUnread(true)
    }
  }, [hasPendingActivity])

  const { data } = useGetPositionsQuery({
    address: account,
    positionStatuses: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED],
  })

  if (!uniswapExtensionRequest) {
    return null
  }

  return (
    <Flex gap="$spacing8">
      <DeepLinkButton
        Icon={<Image height={iconSizes.icon20} source={UNISWAP_LOGO} width={iconSizes.icon20} />}
        Label={t('extension.open')}
        onPress={() => {
          uniswapExtensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Tokens')
          accountDrawer.close()
        }}
      />
      <DeepLinkButton
        Icon={
          <>
            <TimePast size="$icon.20" color="$neutral1" />
            {activityUnread && <UnreadIndicator />}
          </>
        }
        Label={t('common.activity')}
        onPress={() => {
          uniswapExtensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Activity')
          accountDrawer.close()
          setActivityUnread(false)
        }}
      />
      {data && data.positions.length > 0 && (
        <DeepLinkButton
          Icon={<Pool width="20px" height="20px" fill={colors.neutral1.val} />}
          Label={t('common.pools')}
          onPress={() => setMenu({ variant: MenuStateVariant.POOLS })}
        />
      )}
      {openLimitOrders.length > 0 && (
        <DeepLinkButton
          Icon={<ArrowRightToLine size="$icon.20" color="$neutral1" />}
          Label={t('common.limits')}
          onPress={() => setMenu({ variant: MenuStateVariant.LIMITS })}
        />
      )}
    </Flex>
  )
}
