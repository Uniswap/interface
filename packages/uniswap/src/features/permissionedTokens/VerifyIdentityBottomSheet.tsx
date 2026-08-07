import { useCallback, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import { openKycExplainer } from 'uniswap/src/features/permissionedTokens/openKycExplainer'
import { PermissionedSheetHeader } from 'uniswap/src/features/permissionedTokens/PermissionedSheetHeader'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { openUri } from 'uniswap/src/utils/linking'
import { sanitizeUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'

type VerifyIdentityBottomSheetViewProps = {
  isOpen: boolean
  onClose: () => void
  tokenSymbol: string
  registrationUrl: string | undefined
  issuer: string | undefined
  isAllowlisted: boolean
  hasPermissionedToken: boolean
}

function SheetBody({ children, testID }: { children: ReactNode; testID: string }): JSX.Element {
  return (
    <Flex gap="$spacing24" width="100%" p="$padding24" pt="$padding16" testID={testID}>
      {children}
    </Flex>
  )
}

export function VerifyIdentityBottomSheetView({
  isOpen,
  onClose,
  tokenSymbol,
  registrationUrl,
  issuer,
  isAllowlisted,
  hasPermissionedToken,
}: VerifyIdentityBottomSheetViewProps): JSX.Element | null {
  const { t } = useTranslation()

  const handleProceed = useCallback(() => {
    // Self-contained https guard for direct callers of VerifyIdentityBottomSheetView.
    const safeUrl = sanitizeUrl({
      url: registrationUrl,
      allowedProtocols: ['https:'],
      callerName: 'VerifyIdentityBottomSheet',
    })
    if (safeUrl) {
      openUri({ uri: safeUrl, openExternalBrowser: true }).catch((error: unknown) => {
        logger.warn('VerifyIdentityBottomSheet', 'handleProceed', 'openUri failed', { error })
      })
    }
    onClose()
  }, [registrationUrl, onClose])

  const handleLearnMore = useCallback(() => openKycExplainer('VerifyIdentityBottomSheet'), [])

  // BE contract: kycUrl and issuer must be present when isPermissioned && !isAllowlisted. Require
  // BOTH before rendering the verify flow: an empty issuer would interpolate as a blank
  // `{{provider}}` in the description and disclaimer copy (matches the web VerifyIdentityModal).
  const isMissingConfig = isOpen && hasPermissionedToken && !isAllowlisted && (!registrationUrl || !issuer)

  useEffect(() => {
    if (isMissingConfig) {
      logger.warn(
        'VerifyIdentityBottomSheet',
        'render',
        'Blocked state without kycUrl or issuer; BE contract violation, rendering fallback',
        { tokenSymbol, registrationUrl, issuer },
      )
    }
  }, [isMissingConfig, tokenSymbol, registrationUrl, issuer])

  if (!isOpen || !hasPermissionedToken || isAllowlisted) {
    return null
  }

  if (isMissingConfig) {
    return (
      <Modal name={ModalName.VerifyIdentity} isModalOpen={isOpen} onClose={onClose}>
        <SheetBody testID={TestID.VerifyIdentityUnavailableModal}>
          <PermissionedSheetHeader
            icon={<AlertTriangleFilled size="$icon.24" color="$neutral2" />}
            title={t('permissionedPool.verifyIdentity.unavailable.title')}
            description={t('permissionedPool.verifyIdentity.unavailable.description', { tokenSymbol })}
          />
          <Flex row width="100%">
            <Button size="medium" variant="default" emphasis="primary" onPress={onClose}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </SheetBody>
      </Modal>
    )
  }

  return (
    <Modal name={ModalName.VerifyIdentity} isModalOpen={isOpen} onClose={onClose}>
      <SheetBody testID={TestID.VerifyIdentityModal}>
        <PermissionedSheetHeader
          icon={<UserCheck size="$icon.24" color="$neutral1" />}
          title={t('permissionedPool.verifyIdentity.title')}
          description={t('permissionedPool.verifyIdentity.description', { tokenSymbol, provider: issuer ?? '' })}
          learnMoreLabel={t('permissionedPool.verifyIdentity.learnMore')}
          onLearnMore={handleLearnMore}
        />
        <Flex gap="$spacing8" width="100%">
          <Flex row width="100%">
            <Button
              size="medium"
              variant="default"
              emphasis="primary"
              icon={<ExternalLink size="$icon.20" />}
              iconPosition="after"
              testID={TestID.VerifyIdentityButton}
              onPress={handleProceed}
            >
              {t('permissionedPool.verifyIdentity.proceedCta')}
            </Button>
          </Flex>
          <Text variant="body4" color="$neutral3" textAlign="center">
            {t('permissionedPool.verifyIdentity.disclaimer', { provider: issuer ?? '' })}
          </Text>
        </Flex>
      </SheetBody>
    </Modal>
  )
}

type VerifyIdentityBottomSheetProps = {
  isOpen: boolean
  onClose: () => void
}

// Swap-form-coupled wrapper. For surfaces outside the swap form, render
// `VerifyIdentityBottomSheetView` directly with explicit props.
export function VerifyIdentityBottomSheet({ isOpen, onClose }: VerifyIdentityBottomSheetProps): JSX.Element | null {
  const { currencies, chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
    chainId: s.chainId,
  }))

  const platform = chainIdToPlatform(chainId)
  const activeAccount = useActiveAccount(platform)
  const { isAllowlisted, kycUrl, issuer, permissionedSymbol, isPermissioned } = usePermissionedSwapPair({
    inputCurrency: currencies[CurrencyField.INPUT]?.currency,
    outputCurrency: currencies[CurrencyField.OUTPUT]?.currency,
    walletAddress: activeAccount?.address,
  })

  return (
    <VerifyIdentityBottomSheetView
      isOpen={isOpen}
      tokenSymbol={permissionedSymbol ?? ''}
      registrationUrl={kycUrl}
      // Raw issuer (no `?? ''`): an empty issuer must reach the missing-config guard above.
      issuer={issuer}
      isAllowlisted={isAllowlisted}
      hasPermissionedToken={isPermissioned}
      onClose={onClose}
    />
  )
}
