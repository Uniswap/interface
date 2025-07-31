import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useOpenLimitOrders, usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool } from 'components/Icons/Pool'
import { ExtensionRequestMethods, useUniswapExtensionConnector } from 'components/WalletModal/useConnectorWithId'
import { useUpdateAtom } from 'jotai/utils'
import { useTheme } from 'lib/styled-components'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { ArrowRightToLine } from 'ui/src/components/icons/ArrowRightToLine'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'

const UnreadIndicator = () => {
  const theme = useTheme()

  return (
    <Flex position="absolute" left="28px" top="14px">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill={theme.accent1} stroke={theme.surface1} strokeWidth="2px" />
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
  const theme = useTheme()
  const uniswapExtensionConnector = useUniswapExtensionConnector()
  const accountDrawer = useAccountDrawer()
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
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

  if (!uniswapExtensionConnector) {
    return null
  }

  return (
    <Flex gap="$spacing8">
      <DeepLinkButton
        Icon={<Image height={iconSizes.icon20} source={UNISWAP_LOGO} width={iconSizes.icon20} />}
        Label={t('extension.open')}
        onPress={() => {
          uniswapExtensionConnector.extensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Tokens')
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
          uniswapExtensionConnector.extensionRequest(ExtensionRequestMethods.OPEN_SIDEBAR, 'Activity')
          accountDrawer.close()
          setActivityUnread(false)
        }}
      />
      {data && data.positions.length > 0 && (
        <DeepLinkButton
          Icon={<Pool width="20px" height="20px" fill={theme.neutral1} />}
          Label={t('common.pools')}
          onPress={() => setMenu(MenuState.POOLS)}
        />
      )}
      {openLimitOrders.length > 0 && (
        <DeepLinkButton
          Icon={<ArrowRightToLine size="$icon.20" color="$neutral1" />}
          Label={t('common.limits')}
          onPress={() => setMenu(MenuState.LIMITS)}
        />
      )}
    </Flex>
  )
}
