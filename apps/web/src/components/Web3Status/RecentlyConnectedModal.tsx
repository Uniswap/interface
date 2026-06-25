import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { MutableRefObject, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AdaptiveWebPopoverContent,
  Button,
  Flex,
  Portal,
  TamaguiElement,
  Text,
  TouchableArea,
  useMedia,
  useShadowPropsShort,
} from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent, useOnClickOutside } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { StatusIcon } from '~/components/StatusIcon'
import { useRecentConnectorId } from '~/connection/constants'
import { useIsMobile } from '~/hooks/screenSize/useIsMobile'
import { useAccount } from '~/hooks/useAccount'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { useEmbeddedWalletLoginViewStore } from '~/state/embeddedWallet/loginViewStore'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

interface RecentlyConnectedModalUIProps {
  isOpen: boolean
  walletAddress?: string
  displayName: string
  showUnitagIcon: boolean
  showShortAddress: boolean
  shortAddress: string
  onSignIn: () => void
  onClose: () => void
}

export function useWalletDisplay(walletAddress: string | undefined) {
  const displayName = useOnchainDisplayName(walletAddress, {
    showShortenedEns: true,
    includeUnitagSuffix: true,
  })

  return {
    displayName: displayName?.name ?? shortenAddress({ address: walletAddress }),
    showUnitagIcon: displayName?.type === DisplayNameType.Unitag,
    showShortAddress: displayName?.type === DisplayNameType.Unitag || displayName?.type === DisplayNameType.ENS,
    shortAddress: shortenAddress({ address: walletAddress }),
  }
}

function RecentlyConnectedModalUI({
  isOpen,
  walletAddress,
  displayName,
  showUnitagIcon,
  showShortAddress,
  shortAddress,
  onSignIn,
  onClose,
}: RecentlyConnectedModalUIProps) {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsShort()
  const modalRef = useRef<HTMLDivElement>(null)
  const loginButtonRef = useRef<TamaguiElement>(null)
  useOnClickOutside({
    node: modalRef,
    handler: onClose,
  })
  const isMobile = useIsMobile()
  const media = useMedia()

  // The popover's focus scope auto-focuses the first tabbable element on open, which is the X
  // close button. Redirect initial focus to the primary Log in action instead.
  const handleOpenAutoFocus = useEvent((event: Event) => {
    event.preventDefault()
    if (loginButtonRef.current instanceof HTMLElement) {
      loginButtonRef.current.focus()
    }
  })

  // Belt-and-suspenders: stop mousedown bubble inside the card so useOnClickOutside's document
  // listener cannot fire before Button.onPress runs.
  useEffect(() => {
    const node = modalRef.current
    if (!node) {
      return undefined
    }
    const stop = (e: MouseEvent): void => e.stopPropagation()
    node.addEventListener('mousedown', stop)
    return () => node.removeEventListener('mousedown', stop)
  }, [isOpen])

  // Render as a portal-anchored floating card on mobile web. Popover.Content's FloatingUI
  // transform creates a containing block that breaks position: fixed, so we escape via Portal.
  if (media.sm) {
    if (!isOpen) {
      return null
    }
    return (
      <Portal zIndex={zIndexes.toast}>
        {/* oxlint-disable-next-line react/forbid-elements -- needed so the click-outside ref attaches to a real DOM node */}
        <div
          ref={modalRef}
          style={{ position: 'fixed', bottom: 8, left: 8, right: 8, pointerEvents: 'auto', zIndex: zIndexes.toast }}
        >
          <Flex
            row
            alignItems="center"
            gap="$spacing12"
            p="$spacing12"
            backgroundColor="$surface1"
            borderRadius="$rounded20"
            borderWidth="$spacing1"
            borderColor="$surface3"
            enterStyle={{ y: 24, opacity: 0 }}
            exitStyle={{ y: 24, opacity: 0 }}
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            animateOnly={['transform', 'opacity']}
            $platform-web={shadowProps['$platform-web']}
          >
            <Flex flexShrink={0}>
              <StatusIcon address={walletAddress} size={40} />
            </Flex>
            <Flex flex={1} minWidth={0} maxWidth="50%" justifyContent="center">
              <Flex row gap="$spacing4" alignItems="center">
                <Text variant="body1" numberOfLines={1} textOverflow="ellipsis" whiteSpace="nowrap">
                  {displayName}
                </Text>
                {showUnitagIcon && (
                  <Flex flexShrink={0}>
                    <Unitag size={16} />
                  </Flex>
                )}
              </Flex>
              {showShortAddress && (
                <Text variant="body3" color="$neutral2" numberOfLines={1}>
                  {shortAddress}
                </Text>
              )}
            </Flex>
            <Flex row alignItems="center" gap="$spacing8" ml="auto" flexShrink={0}>
              <Button variant="default" py="$spacing8" emphasis="primary" onPress={onSignIn}>
                <Text variant="buttonLabel3" color="$surface1" lineHeight="20px">
                  {t('nav.logIn.button')}
                </Text>
              </Button>
              <TouchableArea
                px="$spacing12"
                py="$spacing8"
                alignItems="center"
                justifyContent="center"
                borderWidth="$spacing1"
                borderColor="$surface3"
                borderRadius="$rounded12"
                onPress={onClose}
              >
                <X size={20} color="$neutral3" />
              </TouchableArea>
            </Flex>
          </Flex>
        </div>
      </Portal>
    )
  }

  return (
    <AdaptiveWebPopoverContent
      isOpen={isOpen}
      id="recently-connected-modal"
      backgroundColor="transparent"
      onOpenAutoFocus={handleOpenAutoFocus}
    >
      <Flex
        ref={modalRef}
        backgroundColor="$surface1"
        p="$spacing16"
        gap="$spacing16"
        width={304}
        enterStyle={{
          x: 24,
          opacity: 0,
        }}
        exitStyle={{
          x: 24,
          opacity: 0,
        }}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        {...shadowProps}
      >
        <Flex row gap="$spacing12" overflow="hidden">
          <StatusIcon address={walletAddress} size={isMobile ? 40 : 48} />
          <Flex gap="$spacing4" flex={1} minWidth={0} justifyContent="center">
            <Flex row gap="$spacing4" alignItems="center">
              <Text variant="body1" numberOfLines={1} textOverflow="ellipsis" whiteSpace="nowrap">
                {displayName}
              </Text>
              {showUnitagIcon && (
                <Flex flexShrink={0} pt="$spacing2">
                  <Unitag size={22} />
                </Flex>
              )}
            </Flex>
            {showShortAddress && (
              <Text variant="body3" color="$neutral2">
                {shortAddress}
              </Text>
            )}
          </Flex>
          <TouchableArea onPress={onClose} alignSelf="flex-start" flexShrink={0}>
            <X size={20} color="$neutral3" />
          </TouchableArea>
        </Flex>
        <Flex row alignSelf="stretch">
          <Button ref={loginButtonRef} variant="default" py="$spacing8" emphasis="primary" onPress={onSignIn}>
            <Text variant="buttonLabel3" color="$surface1" lineHeight="20px">
              {t('nav.logIn.button')}
            </Text>
          </Button>
        </Flex>
      </Flex>
    </AdaptiveWebPopoverContent>
  )
}

// Evaluated at module load — before history.replaceState cleans up the OAuth params.
// Must remain at module scope so it captures the original URL search params.
const isOAuthReturn =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('privy_oauth_code')

function shouldShowModal({
  walletAddress,
  account,
  isEmbeddedWalletEnabled,
  isOpenRef,
  recentConnectorId,
}: {
  walletAddress?: string
  account: ReturnType<typeof useAccount>
  isEmbeddedWalletEnabled: boolean
  isOpenRef: MutableRefObject<boolean>
  recentConnectorId?: string
}) {
  return (
    !!walletAddress &&
    !(account.isConnected || account.isConnecting) &&
    isEmbeddedWalletEnabled &&
    !isOpenRef.current &&
    recentConnectorId === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID &&
    !isOAuthReturn
  )
}

export function RecentlyConnectedModal() {
  const account = useAccount()
  const { walletAddress: walletAddressFromState } = useEmbeddedWalletState()
  const walletAddress = walletAddressFromState ?? undefined
  const { isOpen, closeModal, openModal } = useModalState(ModalName.RecentlyConnectedModal)
  const isOpenRef = useRef(isOpen)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const recentConnectorId = useRecentConnectorId()
  const accountDrawer = useAccountDrawer()
  const setShowLoginView = useEmbeddedWalletLoginViewStore((s) => s.setShowLoginView)
  const setPasskeySignInPending = useEmbeddedWalletLoginViewStore((s) => s.setPasskeySignInPending)
  const { signInWithPasskeyAsync } = useSignInWithPasskey({
    onSuccess: () => {
      setPasskeySignInPending(false)
      closeModal()
    },
    onError: () => {
      setPasskeySignInPending(false)
    },
  })
  const walletDisplay = useWalletDisplay(walletAddress)

  const handleSignIn = useEvent(() => {
    closeModal()
    setShowLoginView(true)
    setPasskeySignInPending(true)
    accountDrawer.open()
    signInWithPasskeyAsync()
  })

  useEffect(() => {
    if (
      shouldShowModal({
        walletAddress,
        account,
        isEmbeddedWalletEnabled,
        isOpenRef,
        recentConnectorId,
      })
    ) {
      openModal()
      isOpenRef.current = true
    }
  }, [walletAddress, account, isEmbeddedWalletEnabled, openModal, recentConnectorId])

  useEffect(() => {
    if (account.isConnected && isOpen) {
      closeModal()
    }
  }, [account.isConnected, account.isConnecting, isOpen, closeModal])

  return (
    <RecentlyConnectedModalUI
      isOpen={isOpen}
      walletAddress={walletAddress}
      {...walletDisplay}
      onSignIn={handleSignIn}
      onClose={closeModal}
    />
  )
}
