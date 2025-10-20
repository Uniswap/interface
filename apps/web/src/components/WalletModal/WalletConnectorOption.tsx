import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import Loader from 'components/Icons/LoadingSpinner'
import { DetectedBadge } from 'components/WalletModal/shared'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useIsInjectedWallet } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Flex, Image, Text, useSporeColors } from 'ui/src'
import { BINANCE_WALLET_ICON, UNISWAP_LOGO } from 'ui/src/assets'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { WalletFilled } from 'ui/src/components/icons/WalletFilled'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import Badge, { BadgeVariant } from 'uniswap/src/components/badge/Badge'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { isIFramed } from 'utils/isIFramed'

function RecentBadge() {
  return (
    <Badge badgeVariant={BadgeVariant.SOFT} borderRadius={4} p={1} px={4}>
      <ThemedText.LabelMicro color="accent1">
        <Trans i18nKey="common.recent" />
      </ThemedText.LabelMicro>
    </Badge>
  )
}

function EmbeddedWalletIcon() {
  return (
    <Flex p="$spacing6" backgroundColor="$accent2" borderRadius="$rounded8">
      <Passkey color="$accent1" size="$icon.20" />
    </Flex>
  )
}

function UniswapMobileIcon({ iconSize }: { iconSize: number }) {
  return isMobileWeb ? (
    <Image height={iconSize} source={UNISWAP_LOGO} width={iconSize} />
  ) : (
    <ScanQr size={iconSize} minWidth={iconSize} color="$accent1" backgroundColor="$accent2" borderRadius={8} p={7} />
  )
}

function BinanceWalletIcon({ iconSize }: { iconSize: number }) {
  return <Image height={iconSize} source={BINANCE_WALLET_ICON} width={iconSize} borderRadius="$rounded8" />
}

function OtherWalletsIcon() {
  return (
    <Flex p="$spacing6" backgroundColor="$accent2" borderRadius="$rounded8">
      <WalletFilled size={20} color="$accent1" />
    </Flex>
  )
}

/**
 * We have custom icons for certain Uniswap Connectors.
 * This function returns the correct icon for the connector.
 */
function getIcon({
  wallet,
  isEmbeddedWalletEnabled,
  themeColors,
}: {
  wallet: ExternalWallet
  isEmbeddedWalletEnabled: boolean
  themeColors: UseSporeColorsReturn
}) {
  const iconSize = isEmbeddedWalletEnabled ? iconSizes.icon32 : iconSizes.icon40

  if (wallet.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID) {
    return <EmbeddedWalletIcon />
  } else if (wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID) {
    return <UniswapMobileIcon iconSize={iconSize} />
  } else if (wallet.id === CONNECTION_PROVIDER_IDS.BINANCE_WALLET_CONNECTOR_ID) {
    return <BinanceWalletIcon iconSize={iconSize} />
  } else {
    // TODO(WEB-7217): RN Web Image is not properly displaying base64 encoded images (Phantom logo) */
    return (
      <img
        src={wallet.icon}
        alt={wallet.name}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 8,
          border: `1px solid ${themeColors.surface3.val}`,
        }}
      />
    )
  }
}

function getConnectorText({ wallet, t }: { wallet: ExternalWallet; t: ReturnType<typeof useTranslation>['t'] }) {
  if (wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID) {
    return t('common.uniswapMobile')
  } else if (wallet.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID) {
    return t('account.passkey.log.in.title')
  } else {
    return wallet.name
  }
}

function RightSideDetail({
  isPendingConnection,
  isRecent,
  detected,
}: {
  isPendingConnection: boolean
  isRecent: boolean
  detected?: boolean
}) {
  if (isPendingConnection) {
    return <Loader />
  } else if (isRecent) {
    return <RecentBadge />
  } else if (detected) {
    return <DetectedBadge />
  }
  return null
}

export function WalletConnectorOption({
  wallet,
  connectOnPlatform = 'any',
}: {
  wallet: ExternalWallet
  connectOnPlatform?: Platform | 'any'
}) {
  const { t } = useTranslation()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const { connectWallet, pendingWallet } = useConnectWallet()

  const isPendingConnection = pendingWallet?.id === wallet.id

  const recentConnectorId = useRecentConnectorId()
  const isRecent = Boolean(recentConnectorId && wallet.id === recentConnectorId)

  const themeColors = useSporeColors()
  const icon = getIcon({ wallet, isEmbeddedWalletEnabled, themeColors })
  const text = getConnectorText({ wallet, t })
  // Porto is set as injected, but we don't want to show it in the wallet modal as a detected wallet
  const isDetected = useIsInjectedWallet(wallet.id)
  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  const isDisabled = Boolean(isPendingConnection && !isIFramed())

  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  const onSuccess = useEvent(() => {
    accountDrawer.close()
    setMenu({ variant: MenuStateVariant.MAIN })
  })

  const individualPlatform = connectOnPlatform === 'any' ? undefined : connectOnPlatform
  const handleConnect = useEvent(() => connectWallet({ wallet, onSuccess, individualPlatform }))

  return (
    <WalletConnectorOptionBase
      icon={icon}
      text={text}
      rightSideDetail={
        <RightSideDetail isPendingConnection={isPendingConnection} isRecent={isRecent} detected={isDetected} />
      }
      onPress={handleConnect}
      isPendingConnection={isPendingConnection}
      isDisabled={isDisabled}
      analyticsProperties={{
        wallet_name: wallet.name,
        wallet_type: wallet.analyticsWalletType,
      }}
    />
  )
}

export function OtherWalletsOption({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()

  return (
    <WalletConnectorOptionBase
      icon={<OtherWalletsIcon />}
      text={t('wallet.other')}
      rightSideDetail={<Chevron rotate="180deg" size="$icon.24" color="$neutral3" />}
      onPress={onPress}
      isPendingConnection={false}
      isDisabled={false}
      analyticsProperties={{ wallet_name: 'OTHER_WALLETS', wallet_type: 'OTHER_WALLETS' }}
    />
  )
}

function WalletConnectorOptionBase({
  icon,
  text,
  rightSideDetail,
  onPress,
  isPendingConnection,
  isDisabled,
  analyticsProperties,
}: {
  icon: JSX.Element
  text: string | undefined
  rightSideDetail: JSX.Element | null
  onPress: () => void
  isPendingConnection: boolean
  isDisabled: boolean
  analyticsProperties: {
    wallet_name: string
    wallet_type: string
  }
}) {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  return (
    <Trace
      logPress
      eventOnTrigger={InterfaceEventName.WalletSelected}
      properties={analyticsProperties}
      element={ElementName.WalletTypeOption}
    >
      <Flex
        backgroundColor={isEmbeddedWalletEnabled ? 'transparent' : '$surface2'}
        row
        alignItems="center"
        width="100%"
        justifyContent="space-between"
        position="relative"
        px="$spacing12"
        py="$spacing18"
        cursor={isDisabled ? 'auto' : 'pointer'}
        hoverStyle={{ backgroundColor: isDisabled ? '$surface2' : '$surface1Hovered' }}
        opacity={isDisabled && !isPendingConnection ? 0.5 : 1}
        onPress={onPress}
      >
        <Flex row alignItems="center" gap="$gap12">
          {icon}
          <Text variant="body2" py="$spacing8">
            {text}
          </Text>
        </Flex>
        {rightSideDetail}
      </Flex>
    </Trace>
  )
}
