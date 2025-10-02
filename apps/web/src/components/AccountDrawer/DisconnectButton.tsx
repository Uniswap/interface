import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { Power } from 'components/Icons/Power'
import { useAccountsStore, useActiveConnector, useActiveWallet } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { useDisconnect } from 'hooks/useDisconnect'
import { useSignOutWithPasskey } from 'hooks/useSignOutWithPasskey'
import { useTheme } from 'lib/styled-components'
import { PropsWithChildren, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, IconButton, Image, Text, Tooltip } from 'ui/src'
import { PlusCircle } from 'ui/src/components/icons/PlusCircle'
import { SwitchArrows } from 'ui/src/components/icons/SwitchArrows'
import { AppTFunction } from 'ui/src/i18n/types'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'

function useOnDisconnect() {
  const disconnect = useDisconnect()

  const activeEVMWallet = useActiveWallet(Platform.EVM)
  const connectedWithEmbeddedWallet = activeEVMWallet?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  const { signOutWithPasskey } = useSignOutWithPasskey()

  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()

  return useEvent(async () => {
    if (connectedWithEmbeddedWallet) {
      signOutWithPasskey()
    }
    dispatch(setIsTestnetModeEnabled(false))
    disconnect()
    accountDrawer.close()
  })
}

function DisconnectTraceWrapper({ children }: PropsWithChildren) {
  const evmConnectorId = useActiveConnector(Platform.EVM)?.externalLibraryId
  const svmConnectorId = useActiveConnector(Platform.SVM)?.externalLibraryId

  return (
    <Trace
      logPress
      element={ElementName.DisconnectWalletButton}
      properties={{ evm_connector_id: evmConnectorId, svm_connector_id: svmConnectorId }}
    >
      {children}
    </Trace>
  )
}

export function DisconnectButton() {
  const onDisconnect = useOnDisconnect()
  const isSolanaEnabled = useFeatureFlag(FeatureFlags.Solana)

  // If Solana is enabled, a menu is shown to allow switching wallets and disconnecting.
  if (isSolanaEnabled) {
    return (
      <DisconnectMenuTooltip>
        <PowerIconButton pointer={false} />
      </DisconnectMenuTooltip>
    )
  }

  return (
    <DisconnectTraceWrapper>
      <PowerIconButton onPress={onDisconnect} pointer={true} />
    </DisconnectTraceWrapper>
  )
}

function PowerIconButton({ onPress, pointer }: { onPress?: () => void; pointer: boolean }) {
  const theme = useTheme()

  return (
    <IconButton
      size="small"
      emphasis="text-only"
      data-testid="wallet-disconnect"
      icon={<Power height={24} width={24} color={theme.neutral2} />}
      borderRadius="$rounded32"
      hoverStyle={{
        backgroundColor: '$surface2',
      }}
      onPress={onPress}
      cursor={pointer ? 'pointer' : 'default'}
    />
  )
}

function DisconnectMenuTooltip({ children }: PropsWithChildren) {
  return (
    <Tooltip placement="bottom-end">
      <Tooltip.Trigger>{children}</Tooltip.Trigger>
      <Tooltip.Content pointerEvents="auto" paddingVertical={8} paddingHorizontal={8}>
        <DisconnectMenu />
      </Tooltip.Content>
    </Tooltip>
  )
}

function DisconnectMenuButtonRow({ children, onPress }: PropsWithChildren<{ onPress: () => void }>) {
  return (
    <Button
      gap="$spacing8"
      emphasis="text-only"
      alignItems="center"
      onPress={onPress}
      justifyContent="flex-start"
      hoverStyle={{
        backgroundColor: '$surface2',
      }}
      px="$spacing12"
      py="$padding12"
      borderRadius="$rounded8"
      cursor="pointer"
    >
      {children}
    </Button>
  )
}

type SwitchButtonVariantParams = {
  connectedOnThisPlatform: boolean
  connectedOnOtherPlatform: boolean
}

type SwitchButtonVariant = 'switch' | 'switch_platform' | 'connect_platform'

function getSwitchButtonVariant(params: SwitchButtonVariantParams): SwitchButtonVariant {
  const { connectedOnThisPlatform, connectedOnOtherPlatform } = params
  if (connectedOnThisPlatform) {
    if (connectedOnOtherPlatform) {
      return 'switch_platform'
    }
    return 'switch'
  }

  return 'connect_platform'
}

function getSwitchButtonIcon({ wallet, variant }: { wallet?: ExternalWallet; variant: SwitchButtonVariant }) {
  switch (variant) {
    case 'switch':
      return <SwitchArrows size={16} color="$neutral1" />
    case 'switch_platform':
      return wallet?.icon ? (
        <Image src={wallet.icon} borderRadius="$rounded8" width={16} height={16} />
      ) : (
        <SwitchArrows size={16} color="$neutral1" />
      )
    case 'connect_platform':
      return <PlusCircle size={16} color="$neutral1" />
    default:
      throw new Error(`Invalid switch button icon variant: ${variant}`)
  }
}

function getSwitchButtonText({
  t,
  variant,
  platform,
}: {
  t: AppTFunction
  variant: SwitchButtonVariant
  platform: Platform
}) {
  const switchPlatformText = {
    [Platform.EVM]: t('common.connectAWallet.button.evm.switch'),
    [Platform.SVM]: t('common.connectAWallet.button.svm.switch'),
  }

  const connectPlatformText = {
    [Platform.EVM]: t('common.connectAWallet.button.evm'),
    [Platform.SVM]: t('common.connectAWallet.button.svm'),
  }

  switch (variant) {
    case 'switch':
      return t('common.connectAWallet.button.switch')
    case 'switch_platform':
      return switchPlatformText[platform]
    case 'connect_platform':
      return connectPlatformText[platform]
    default:
      throw new Error(`Invalid switch button variant: ${variant}`)
  }
}

function useSwitchWalletButtonAction({ variant, platform }: { variant: SwitchButtonVariant; platform: Platform }) {
  const setMenu = useSetMenu()

  const connectOnPlatform = useEvent(() => setMenu({ variant: MenuStateVariant.CONNECT_PLATFORM, platform }))
  const connectOnAnyPlatform = useEvent(() => setMenu({ variant: MenuStateVariant.SWITCH }))

  switch (variant) {
    case 'switch':
      return connectOnAnyPlatform
    case 'switch_platform':
      return connectOnPlatform
    case 'connect_platform':
      return connectOnPlatform
    default:
      throw new Error(`Invalid switch button action variant: ${variant}`)
  }
}

/** Ensures "connect" is always at the bottom */
function sortSwitchButtons(a: { variant: SwitchButtonVariant }, b: { variant: SwitchButtonVariant }) {
  if (a.variant === 'connect_platform') {
    return 1
  }
  if (b.variant === 'connect_platform') {
    return -1
  }
  return 0
}

const PLATFORMS = [Platform.EVM, Platform.SVM] as const
function useSwitchButtonVariants() {
  const platformConnectedStatuses = useAccountsStore((state) => ({
    [Platform.EVM]: state.getConnectionStatus(Platform.EVM).isConnected,
    [Platform.SVM]: state.getConnectionStatus(Platform.SVM).isConnected,
  }))

  return useMemo(() => {
    return PLATFORMS.map((platform) => {
      const otherPlatform = platform === Platform.EVM ? Platform.SVM : Platform.EVM
      const connectedOnOtherPlatform = platformConnectedStatuses[otherPlatform]
      const connectedOnThisPlatform = platformConnectedStatuses[platform]
      const variant = getSwitchButtonVariant({ connectedOnThisPlatform, connectedOnOtherPlatform })
      return { platform, variant }
    }).sort(sortSwitchButtons)
  }, [platformConnectedStatuses])
}

function SwitchWalletButtonRow({ variant, platform }: { variant: SwitchButtonVariant; platform: Platform }) {
  const onPress = useSwitchWalletButtonAction({ variant, platform })
  const { t } = useTranslation()
  const activeWallet = useActiveWallet(platform)

  const icon = getSwitchButtonIcon({ wallet: activeWallet, variant })
  const text = getSwitchButtonText({ t, variant, platform })

  return (
    <DisconnectMenuButtonRow onPress={onPress}>
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {text}
      </Text>
    </DisconnectMenuButtonRow>
  )
}

function InLineDisconnectButton() {
  const onDisconnect = useOnDisconnect()
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <DisconnectTraceWrapper>
      <DisconnectMenuButtonRow onPress={onDisconnect}>
        <Power height={16} width={16} color={theme.neutral1} />
        <Text variant="buttonLabel3" color="$neutral1">
          {t('common.button.disconnect')}
        </Text>
      </DisconnectMenuButtonRow>
    </DisconnectTraceWrapper>
  )
}

/** Returns the order in which the connection rows should be displayed, in order to ensure "connect" always comes after "switch" */
function SwitchWalletButtons() {
  const switchButtonVariants = useSwitchButtonVariants()

  return switchButtonVariants.map(({ platform, variant }) => (
    <SwitchWalletButtonRow key={platform} platform={platform} variant={variant} />
  ))
}

function DisconnectMenu() {
  return (
    <Flex gap="$spacing2">
      <SwitchWalletButtons />
      <InLineDisconnectButton />
    </Flex>
  )
}
