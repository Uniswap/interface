import { MenuStateVariant, useSetMenuCallback } from 'components/AccountDrawer/menuState'
import { UniswapMobileWalletConnectorOption } from 'components/WalletModal/UniswapMobileWalletConnectorOption'
import { OtherWalletsOption, WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWallets } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { Fragment } from 'react'
import { transitions } from 'theme/styles'
import { Flex, Separator } from 'ui/src'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isMobileWeb } from 'utilities/src/platform'

interface WalletOptionsGridProps {
  connectOnPlatform?: Platform | 'any'
  showMobileConnector?: boolean
  showOtherWallets?: boolean
  showSeparators?: boolean
  maxHeight?: string
  opacity?: number
}

export function WalletOptionsGrid({
  connectOnPlatform,
  showMobileConnector = false,
  showOtherWallets = false,
  showSeparators = true,
  maxHeight = '100vh',
  opacity = 1,
}: WalletOptionsGridProps): JSX.Element {
  const showOtherWalletsCallback = useSetMenuCallback(MenuStateVariant.OTHER_WALLETS)
  const wallets = useOrderedWallets({ showSecondaryConnectors: isMobileWeb, platformFilter: connectOnPlatform })
  const recentConnectorId = useRecentConnectorId()

  const shouldShowMobileConnector =
    showMobileConnector &&
    (recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID || isMobileWeb)

  return (
    <Flex row alignItems="flex-start">
      <Flex
        borderRadius="$rounded16"
        overflow="hidden"
        width="100%"
        maxHeight={maxHeight}
        opacity={opacity}
        transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
        data-testid="option-grid"
      >
        {shouldShowMobileConnector && (
          <>
            <UniswapMobileWalletConnectorOption />
            <Separator />
          </>
        )}
        {wallets.map((wallet, index) => (
          <Fragment key={wallet.name}>
            <WalletConnectorOption wallet={wallet} connectOnPlatform={connectOnPlatform} />
            {showSeparators && (index < wallets.length - 1 || showOtherWallets) && <Separator />}
          </Fragment>
        ))}
        {showOtherWallets && !isMobileWeb && <OtherWalletsOption onPress={showOtherWalletsCallback} />}
      </Flex>
    </Flex>
  )
}
