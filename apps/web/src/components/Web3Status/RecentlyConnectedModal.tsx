import StatusIcon from 'components/Identicon/StatusIcon'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { useAccount } from 'hooks/useAccount'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import { MutableRefObject, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen, useOpenModal } from 'state/application/hooks'
import { useEmbeddedWalletState } from 'state/embeddedWallet/store'
import { AdaptiveWebPopoverContent, Button, Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { X } from 'ui/src/components/icons/X'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useENSName } from 'uniswap/src/features/ens/api'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useOnClickOutside } from 'utilities/src/react/hooks'

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

function useWalletDisplay(walletAddress: string | undefined) {
  const { data: ensName } = useENSName(walletAddress)
  const { unitag } = useUnitagByAddress(walletAddress)

  return {
    displayName: unitag?.username ?? ensName ?? shortenAddress(walletAddress),
    showUnitagIcon: !!unitag?.username,
    showShortAddress: !!(ensName || unitag?.username),
    shortAddress: shortenAddress(walletAddress),
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
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(modalRef, onClose)
  const isMobile = useIsMobile()

  return (
    <AdaptiveWebPopoverContent isOpen={isOpen} id="recently-connected-modal" backgroundColor="transparent">
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
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        $md={{
          borderWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Flex row gap="$spacing12" overflow="hidden">
          <StatusIcon address={walletAddress} size={isMobile ? 40 : 48} />
          <Flex gap="$spacing8" width="75%" $md={{ gap: 0 }}>
            <Flex row gap="$spacing4" alignItems="center">
              <Text variant="body1" numberOfLines={1} textOverflow="ellipsis" whiteSpace="nowrap">
                {displayName}
              </Text>
              {showUnitagIcon && (
                <Flex flexShrink={0}>
                  <Unitag size={16} />
                </Flex>
              )}
              <X
                onPress={onClose}
                size={20}
                color="$neutral3"
                ml="auto"
                cursor="pointer"
                hoverStyle={{ opacity: 0.8 }}
                alignSelf="flex-start"
                display="flex"
                flexShrink={0}
                $md={{ display: 'none' }}
              />
            </Flex>
            {showShortAddress && (
              <Text variant="body3" color="$neutral2">
                {shortAddress}
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex row alignSelf="stretch" $md={{ ml: 'auto', alignSelf: 'center' }}>
          <Button variant="default" py="$spacing8" emphasis="primary" onPress={onSignIn}>
            <Text variant="buttonLabel3" color="$surface1" lineHeight="20px">
              {t('nav.signIn.button')}
            </Text>
          </Button>
        </Flex>
        <Flex
          px="$spacing12"
          py="$spacing8"
          alignItems="center"
          justifyContent="center"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded12"
          display="none"
          cursor="pointer"
          hoverStyle={{ opacity: 0.8 }}
          $md={{ display: 'flex' }}
        >
          <X onPress={onClose} size={20} color="$neutral3" />
        </Flex>
      </Flex>
    </AdaptiveWebPopoverContent>
  )
}

function shouldShowModal(
  walletAddress: string | undefined,
  account: ReturnType<typeof useAccount>,
  isEmbeddedWalletEnabled: boolean,
  isOpenRef: MutableRefObject<boolean>,
  recentConnectorId?: string,
) {
  return (
    !!walletAddress &&
    !(account.isConnected || account.isConnecting) &&
    isEmbeddedWalletEnabled &&
    !isOpenRef.current &&
    recentConnectorId === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  )
}

export function RecentlyConnectedModal() {
  const account = useAccount()
  const { walletAddress: walletAddressFromState } = useEmbeddedWalletState()
  const walletAddress = walletAddressFromState ?? undefined
  const isOpen = useModalIsOpen(ModalName.RecentlyConnectedModal)
  const isOpenRef = useRef(isOpen)
  const closeModal = useCloseModal(ModalName.RecentlyConnectedModal)
  const openModal = useOpenModal({ name: ModalName.RecentlyConnectedModal })
  const { signInWithPasskey } = useSignInWithPasskey({ onSuccess: closeModal })
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const recentConnectorId = useRecentConnectorId()

  const walletDisplay = useWalletDisplay(walletAddress)

  useEffect(() => {
    if (shouldShowModal(walletAddress, account, isEmbeddedWalletEnabled, isOpenRef, recentConnectorId)) {
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
      onSignIn={() => signInWithPasskey()}
      onClose={closeModal}
    />
  )
}
