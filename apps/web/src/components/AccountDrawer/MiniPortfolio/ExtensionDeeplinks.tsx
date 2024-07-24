import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/DefaultMenu'
import { useOpenLimitOrders, usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useFilterPossiblyMaliciousPositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool } from 'components/Icons/Pool'
import { ExtensionRequestMethods, useUniswapExtensionConnector } from 'components/WalletModal/useOrderedConnections'
import { t } from 'i18n'
import { useUpdateAtom } from 'jotai/utils'
import { useTheme } from 'lib/styled-components'
import { useEffect, useState } from 'react'
import { Button, Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { ArrowRightToLine, RotatableChevron, TimePast } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme/iconSizes'

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
    <Button
      display="flex"
      alignItems="center"
      gap="$spacing12"
      theme="outline"
      px="$spacing16"
      py="$spacing12"
      fontSize="$large"
      onPress={onPress}
      hoverStyle={{ opacity: 0.9 }}
    >
      {Icon}
      <Text display="flex" flex={1} variant="buttonLabel3">
        {Label}
      </Text>
      <RotatableChevron width={iconSizes.icon20} height={iconSizes.icon20} color="$neutral3" direction="right" />
    </Button>
  )
}

export function ExtensionDeeplinks({ account }: { account: string }) {
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

  const { positions } = useMultiChainPositions(account)
  const filteredPositions = useFilterPossiblyMaliciousPositionInfo(positions)

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
      {filteredPositions.length > 0 && (
        <DeepLinkButton
          Icon={<Pool width="20px" height="20px" fill={theme.neutral1} />}
          Label={t('common.pools')}
          onPress={() => setMenu(MenuState.POOLS)}
        />
      )}
      {openLimitOrders.length > 0 && (
        <DeepLinkButton
          Icon={<ArrowRightToLine size={iconSizes.icon20} color="$neutral1" />}
          Label={t('common.limits')}
          onPress={() => setMenu(MenuState.LIMITS)}
        />
      )}
    </Flex>
  )
}
