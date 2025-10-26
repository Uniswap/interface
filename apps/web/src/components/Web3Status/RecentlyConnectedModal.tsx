import StatusIcon from 'components/StatusIcon'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import { MutableRefObject, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useEmbeddedWalletState } from 'state/embeddedWallet/store'
import { AdaptiveWebPopoverContent, Button, Flex, Text, useShadowPropsShort } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { X } from 'ui/src/components/icons/X'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
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
  useOnClickOutside({
    node: modalRef,
    handler: onClose,
  })
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
        {...shadowProps}
      >
        <Flex row gap="$spacing12" overflow="hidden">
          <StatusIcon address={walletAddress} size={isMobile ? 40 : 48} />
          <Flex gap="$spacing4" width="75%" $md={{ gap: 0 }} justifyContent="center">
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
              {t('nav.logIn.button')}
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
    recentConnectorId === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
  )
}

export function RecentlyConnectedModal() {
  const account = useAccount()
  const { walletAddress: walletAddressFromState } = useEmbeddedWalletState()
  const walletAddress = walletAddressFromState ?? undefined
  const { isOpen, closeModal, openModal } = useModalState(ModalName.RecentlyConnectedModal)
  const isOpenRef = useRef(isOpen)
  const { signInWithPasskey } = useSignInWithPasskey({ onSuccess: closeModal })
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const recentConnectorId = useRecentConnectorId()

  const walletDisplay = useWalletDisplay(walletAddress)

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: account.isConnecting dependency is sufficient for this effect
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
