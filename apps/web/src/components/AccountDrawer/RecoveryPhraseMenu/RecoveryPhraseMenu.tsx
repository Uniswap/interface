import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportSeedPhrase } from 'uniswap/src/features/passkey/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { useTimeout } from 'utilities/src/time/timing'
import { invalidateListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { PhraseDisplayContent } from '~/components/AccountDrawer/RecoveryPhraseMenu/PhraseDisplayContent'
import { WarningContent } from '~/components/AccountDrawer/RecoveryPhraseMenu/WarningContent'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { useCopyClipboard } from '~/hooks/useCopyClipboard'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

const AUTO_HIDE_MS = 60_000

enum ExportStep {
  WARNING = 'warning',
  DISPLAY = 'display',
}

export function RecoveryPhraseMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { walletId } = useEmbeddedWalletState()
  const [step, setStep] = useState<ExportStep>(ExportStep.WARNING)
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, copyToClipboard] = useCopyClipboard(1000)

  // Security: clear seed phrase on unmount
  useEffect(() => {
    return () => {
      setSeedPhrase(null)
      setIsVisible(false)
    }
  }, [])

  // Auto-hide after 1 minute. `useTimeout` skips scheduling when delay < 0,
  // so the hidden state is a no-op. Revert to WARNING so the user isn't
  // stranded on a display screen with cleared state.
  const autoHide = useCallback(() => {
    setIsVisible(false)
    setSeedPhrase(null)
    setStep(ExportStep.WARNING)
  }, [])
  useTimeout(autoHide, isVisible ? AUTO_HIDE_MS : -1)

  const handleViewRecoveryPhrase = useCallback(async () => {
    setIsLoading(true)
    try {
      const phrase = await exportSeedPhrase({ walletId: walletId ?? undefined })
      if (phrase) {
        setSeedPhrase(phrase)
        setStep(ExportStep.DISPLAY)
        // Refresh the lastExported timestamp surfaced in the delete passkey speedbump.
        void invalidateListAuthenticators(queryClient, walletId)
      }
    } catch (e) {
      logger.error(e, {
        tags: { file: 'RecoveryPhraseMenu.tsx', function: 'handleViewRecoveryPhrase' },
      })
    } finally {
      setIsLoading(false)
    }
  }, [walletId, queryClient])

  const handleToggleVisibility = (): void => setIsVisible((prev) => !prev)

  const handleCopy = useCallback(() => {
    if (seedPhrase) {
      copyToClipboard(seedPhrase)
      setIsVisible(false)
    }
  }, [seedPhrase, copyToClipboard])

  const handleDone = useCallback(() => {
    setSeedPhrase(null)
    setIsVisible(false)
    onClose()
  }, [onClose])

  return (
    <Trace logImpression modal={ModalName.ViewSeedPhraseWarning}>
      <SlideOutMenu title={t('settings.setting.recoveryPhrase.title')} onClose={handleDone}>
        {step === ExportStep.WARNING ? (
          <WarningContent onContinue={handleViewRecoveryPhrase} isLoading={isLoading} />
        ) : (
          <PhraseDisplayContent
            seedPhrase={seedPhrase}
            isVisible={isVisible}
            isCopied={isCopied}
            onToggleVisibility={handleToggleVisibility}
            onCopy={handleCopy}
            onDone={handleDone}
          />
        )}
      </SlideOutMenu>
    </Trace>
  )
}
