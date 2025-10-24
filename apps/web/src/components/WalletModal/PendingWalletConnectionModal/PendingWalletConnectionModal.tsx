import {
  getWalletRequiresSeparatePrompt,
  useHasAcceptedSolanaConnectionPrompt,
} from 'components/WalletModal/PendingWalletConnectionModal/state'
import { WalletIconWithRipple } from 'components/WalletModal/WalletIconWithRipple'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, HeightAnimator, Text } from 'ui/src'
import SOLANA_ICON from 'ui/src/assets/logos/png/solana-logo.png'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useDebounce } from 'utilities/src/time/timing'

/**
 * Debounces resets of the the Solana acceptance flag to prevent the modal from reacting to resets before it has had a chance to close.
 * This solves a connection edge case where Solana is rejected in a dual VM connection, so the flag is reset, but the modal should close first.
 */
function useHasAcceptedSolanaConnectionPromptWithBuffer() {
  const { hasAcceptedSolanaConnectionPrompt: value } = useHasAcceptedSolanaConnectionPrompt()
  const debouncedValue = useDebounce(value, 100)

  // We only want to debounce resets / when the value becomes false
  if (value === false) {
    return debouncedValue
  }

  return value
}

/** Returns a wallet IF it's currently connecting AND requires separate EVM/SVM prompts (e.g. MetaMask). */
function useApplicablePendingWallet() {
  const { pendingWallet, isConnecting } = useConnectWallet()

  if (!isConnecting || !pendingWallet || !getWalletRequiresSeparatePrompt(pendingWallet.id)) {
    return undefined
  }

  return pendingWallet
}

/**
 * Tracks which wallet needs the Solana prompt. Persists after EVM completes to keep modal open.
 * Different from useApplicablePendingWallet which becomes undefined once connection starts.
 */
function useSolanaWalletToPrompt(applicablePendingWallet: ExternalWallet | undefined) {
  const hasAcceptedSolanaConnectionPrompt = useHasAcceptedSolanaConnectionPromptWithBuffer()

  const [solanaWalletToPrompt, setSolanaWalletToPrompt] = useState<ExternalWallet>()

  const isMultiPlatformConnection = !useConnectWallet().variables?.individualPlatform

  // Set a flag to keep the modal open if the solana prompt should be shown
  useEffect(() => {
    if (applicablePendingWallet && !hasAcceptedSolanaConnectionPrompt && isMultiPlatformConnection) {
      setSolanaWalletToPrompt(applicablePendingWallet)
    }
  }, [hasAcceptedSolanaConnectionPrompt, applicablePendingWallet, isMultiPlatformConnection])

  const resetSolanaWalletToPrompt = useEvent(() => {
    setSolanaWalletToPrompt(undefined)
  })

  return { solanaWalletToPrompt, resetSolanaWalletToPrompt }
}

/** Modal for dual-VM wallets (MetaMask) that shows connection status and prompts for Solana opt-in. */
export default function PendingWalletConnectionModal() {
  const applicablePendingWallet = useApplicablePendingWallet()
  const { reset: resetConnectionQuery } = useConnectWallet()

  const { solanaWalletToPrompt, resetSolanaWalletToPrompt } = useSolanaWalletToPrompt(applicablePendingWallet)

  const closeModal = useEvent(() => {
    resetConnectionQuery()
    resetSolanaWalletToPrompt()
  })

  const modalContent = useModalContent({ showSolanaPrompt: Boolean(solanaWalletToPrompt) })

  const isOpen = Boolean(applicablePendingWallet) || (Boolean(solanaWalletToPrompt) && !!modalContent)

  return (
    <Modal name={ModalName.PendingWalletConnection} isModalOpen={isOpen} onClose={closeModal}>
      <Flex fill alignItems="flex-end">
        <CloseIconWithHover onClose={closeModal} size="$icon.20" />
      </Flex>
      <HeightAnimator useInitialHeight animation="200ms">
        <Flex width="100%" alignItems="center" gap="$spacing24">
          <WalletIconWithRipple
            src={modalContent?.icon}
            alt={`${applicablePendingWallet?.name}-pending-modal-icon`}
            size={48}
            showRipple={modalContent?.animate}
          />
          <Flex width="100%" fill position="relative" minHeight={60}>
            <AnimatePresence initial={false}>
              <Flex
                width="100%"
                position="absolute"
                top={0}
                left={0}
                right={0}
                alignItems="center"
                key={modalContent?.key}
                animation="200ms"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                gap="$spacing8"
              >
                <Text variant="subheading1" color="$neutral1">
                  {modalContent?.title}
                </Text>
                <Text variant="body2" color="$neutral2">
                  {modalContent?.description}
                </Text>
              </Flex>
            </AnimatePresence>
          </Flex>
          <UserInput solanaWalletToPrompt={solanaWalletToPrompt} resetModalState={resetSolanaWalletToPrompt} />
        </Flex>
      </HeightAnimator>
    </Modal>
  )
}

function useModalContent(params: { showSolanaPrompt: boolean }) {
  const { showSolanaPrompt } = params

  const { t } = useTranslation()
  const { pendingWallet } = useConnectWallet()

  const evmConnecting = useConnectionStatus(Platform.EVM).isConnecting
  const svmConnecting = useConnectionStatus(Platform.SVM).isConnecting

  const content = useMemo(() => {
    if (evmConnecting) {
      return {
        key: 'evm-connecting',
        title: t('wallet.connecting.title.evm', { walletName: pendingWallet?.name }),
        description: t('wallet.connecting.description'),
        icon: pendingWallet?.icon,
        animate: true,
      }
    }

    if (showSolanaPrompt) {
      return {
        key: 'solana-prompt',
        title: t('wallet.connecting.solanaPrompt', { walletName: pendingWallet?.name }),
        description: t('wallet.connecting.solanaPrompt.description'),
        icon: SOLANA_ICON,
        animate: false,
      }
    }

    if (svmConnecting) {
      return {
        key: 'svm-connecting',
        title: t('wallet.connecting.title.svm', { walletName: pendingWallet?.name }),
        description: t('wallet.connecting.description'),
        icon: SOLANA_ICON,
        animate: true,
      }
    }

    return undefined
  }, [showSolanaPrompt, evmConnecting, svmConnecting, pendingWallet?.name, pendingWallet?.icon, t])

  return content
}

function UserInput(props: { solanaWalletToPrompt: ExternalWallet | undefined; resetModalState: () => void }) {
  const { t } = useTranslation()
  const { solanaWalletToPrompt, resetModalState } = props
  const { connectWallet, isConnecting } = useConnectWallet()
  const { setHasAcceptedSolanaConnectionPrompt } = useHasAcceptedSolanaConnectionPrompt()

  const connectSolana = useEvent(() => {
    if (solanaWalletToPrompt) {
      setHasAcceptedSolanaConnectionPrompt(true)
      connectWallet({ wallet: solanaWalletToPrompt, individualPlatform: Platform.SVM })
      resetModalState()
    }
  })

  return (
    <AnimatePresence>
      {solanaWalletToPrompt && !isConnecting && (
        <Flex width="100%" animation="200ms" enterStyle={{ opacity: 0, y: 10 }} exitStyle={{ opacity: 0, y: 10 }}>
          <Flex width="100%" row gap="$spacing8">
            <Button fill size="small" emphasis="secondary" onPress={resetModalState}>
              {t('common.button.skip')}
            </Button>
            <Button fill size="small" emphasis="primary" onPress={connectSolana}>
              {t('wallet.connecting.solanaPrompt.button')}
            </Button>
          </Flex>
        </Flex>
      )}
    </AnimatePresence>
  )
}
