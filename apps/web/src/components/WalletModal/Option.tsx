import { UseMutateFunction } from '@tanstack/react-query'
import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import Loader from 'components/Icons/LoadingSpinner'
import { DetectedBadge } from 'components/WalletModal/shared'
import { ConnectorID, useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { CONNECTOR_ICON_OVERRIDE_MAP, useRecentConnectorId } from 'components/Web3Provider/constants'
import { uniswapWalletConnect, walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { useConnect } from 'hooks/useConnect'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { ThemedText } from 'theme/components'
import { Flex, Image, Text, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { WalletFilled } from 'ui/src/components/icons/WalletFilled'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import Badge, { BadgeVariant } from 'uniswap/src/components/badge/Badge'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isMobileWeb } from 'utilities/src/platform'
import { isIFramed } from 'utils/isIFramed'
import { Connector } from 'wagmi'

export enum AlternativeOption {
  OTHER_WALLETS = 'OTHER_WALLETS',
}

const RecentBadge = () => (
  <Badge badgeVariant={BadgeVariant.SOFT} borderRadius={4} p={1} px={4}>
    <ThemedText.LabelMicro color="accent1">
      <Trans i18nKey="common.recent" />
    </ThemedText.LabelMicro>
  </Badge>
)

function EmbeddedWalletIcon() {
  return (
    <Flex p="$spacing6" backgroundColor="$accent2" borderRadius="$rounded8">
      <Passkey color="$accent1" size={iconSizes.icon20} />
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
  connector,
  connectorId,
  isEmbeddedWalletEnabled,
  themeColors,
}: {
  connector?: Connector
  connectorId: string
  isEmbeddedWalletEnabled: boolean
  themeColors: UseSporeColorsReturn
}) {
  const iconSize = isEmbeddedWalletEnabled ? iconSizes.icon32 : iconSizes.icon40

  if (connectorId === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID) {
    return <EmbeddedWalletIcon />
  } else if (connectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID) {
    return <UniswapMobileIcon iconSize={iconSize} />
  } else if (connectorId === AlternativeOption.OTHER_WALLETS) {
    return <OtherWalletsIcon />
  } else {
    const icon = CONNECTOR_ICON_OVERRIDE_MAP[connectorId] ?? connector?.icon
    // TODO(WEB-7217): RN Web Image is not properly displaying base64 encoded images (Phantom logo) */
    return (
      <img
        src={icon}
        alt={connector?.name}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 12,
          border: `1px solid ${themeColors.surface3.val}`,
        }}
      />
    )
  }
}

function getConnectorText({
  connector,
  connectorId,
  t,
}: {
  connector?: Connector
  connectorId: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  if (connectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID) {
    return t('common.uniswapMobile')
  } else if (connectorId === AlternativeOption.OTHER_WALLETS) {
    return t('wallet.other')
  } else {
    return connector?.name
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
  return isPendingConnection ? <Loader /> : isRecent ? <RecentBadge /> : detected ? <DetectedBadge /> : null
}

function createWalletConnectionHandler({
  connection,
  setPersistHideMobileAppPromoBanner,
  signInWithPasskey,
}: {
  connection: ReturnType<typeof useConnect>
  setPersistHideMobileAppPromoBanner: (value: boolean) => void
  signInWithPasskey: UseMutateFunction<string, Error, void, unknown>
}) {
  async function connectEmbeddedWallet() {
    await signInWithPasskey()
  }

  function connectUniswapWallet() {
    setPersistHideMobileAppPromoBanner(true)
    connection.connect({
      // Initialize Uniswap Wallet on click instead of in wagmi config
      // to avoid multiple wallet connect sockets being opened
      // and causing issues with messages getting dropped
      connector: uniswapWalletConnect(),
    })
  }

  function connectStandardWallet(connector: Connector) {
    // This is a hack to ensure the connection runs in playwright
    // TODO(WEB-4173): Look into removing setTimeout connection.connect({ connector })
    if (isPlaywrightEnv()) {
      setTimeout(() => connection.connect({ connector }), 1)
    } else {
      connection.connect({ connector })
    }
  }

  return function handleWalletConnection({
    connectorId,
    connector,
    onPress,
  }: {
    connectorId: string
    connector?: Connector
    onPress?: () => void
  }): void {
    if (onPress) {
      onPress()
      return
    }

    switch (connectorId) {
      case CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID:
        connectEmbeddedWallet()
        return

      case CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
        connectUniswapWallet()
        return

      default:
        if (!connector) {
          return
        }
        connectStandardWallet(connector)
        return
    }
  }
}

export function Option({
  connectorId,
  detected,
  onPress,
}: {
  connectorId: string
  detected?: boolean
  onPress?: () => void
}) {
  const { t } = useTranslation()
  const connection = useConnect()
  const connector = useConnectorWithId(connectorId as ConnectorID)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const { signInWithPasskey } = useSignInWithPasskey()
  const [, setPersistHideMobileAppPromoBanner] = useAtom(persistHideMobileAppPromoBannerAtom)
  const isPendingConnection = connection.isPending && connection.variables?.connector === connector
  const isRecent = connectorId === useRecentConnectorId()
  const themeColors = useSporeColors()
  const icon = getIcon({ connector, connectorId, isEmbeddedWalletEnabled, themeColors })
  const text = getConnectorText({ connector, connectorId, t })
  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  const isDisabled = Boolean(connection?.isPending && !isIFramed())

  const handleConnectionFn = useMemo(
    () =>
      createWalletConnectionHandler({
        connection,
        setPersistHideMobileAppPromoBanner,
        signInWithPasskey,
      }),
    [connection, setPersistHideMobileAppPromoBanner, signInWithPasskey],
  )

  const handleConnect = () => handleConnectionFn({ connectorId, connector, onPress })

  return (
    <Flex
      backgroundColor={isEmbeddedWalletEnabled ? 'transparent' : '$surface2'}
      row
      alignItems="center"
      width="100%"
      justifyContent="space-between"
      position="relative"
      p="$spacing18"
      cursor={isDisabled ? 'auto' : 'pointer'}
      hoverStyle={{ backgroundColor: isDisabled ? '$surface2' : '$surface3' }}
      opacity={isDisabled && !isPendingConnection ? 0.5 : 1}
      data-testid={`wallet-option-${connector?.type}`}
      onPress={handleConnect}
    >
      <Trace
        logPress
        eventOnTrigger={InterfaceEventName.WALLET_SELECTED}
        properties={{
          wallet_name: connector?.name ?? connectorId,
          wallet_type: walletTypeToAmplitudeWalletType(connector?.type ?? connectorId),
        }}
        element={InterfaceElementName.WALLET_TYPE_OPTION}
      >
        <Flex row alignItems="center" gap="$gap8">
          {icon}
          <Text variant="buttonLabel2" py="$spacing8">
            {text}
          </Text>
        </Flex>
        <RightSideDetail isPendingConnection={isPendingConnection} isRecent={isRecent} detected={detected} />
      </Trace>
    </Flex>
  )
}
