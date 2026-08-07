import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useModalState } from '~/hooks/useModalState'

type VerifyIdentityModalProps = {
  tokenSymbol: string
  registrationUrl: string | undefined
  issuer: string | undefined
}

export function VerifyIdentityModal({ tokenSymbol, registrationUrl, issuer }: VerifyIdentityModalProps) {
  const { t } = useTranslation()
  const { isOpen, closeModal } = useModalState(ModalName.VerifyIdentity)

  // Require BOTH registrationUrl and issuer. An empty issuer would otherwise interpolate as a
  // blank `{{provider}}` in the modal copy ("...completed directly with ⟨blank⟩'s Terms of
  // Service..."). Falling back here hardens every caller against a missing/empty issuer, so a
  // bad/empty `CheckPermissions` response can never leak blank provider copy.
  const isMissingConfig = isOpen && (!registrationUrl || !issuer)

  useEffect(() => {
    if (isMissingConfig) {
      logger.warn(
        'VerifyIdentityModal',
        'render',
        'Blocked state without registrationUrl or issuer; BE contract violation',
        {
          tokenSymbol,
          registrationUrl,
          issuer,
        },
      )
    }
  }, [isMissingConfig, tokenSymbol, registrationUrl, issuer])

  const handleProceed = useCallback(() => {
    if (!registrationUrl) {
      return
    }
    // Issuer-provided URL — not marked isSafeUri; openUri will enforce http/https.
    openUri({ uri: registrationUrl, openExternalBrowser: true }).catch((error: unknown) => {
      logger.warn('VerifyIdentityModal', 'handleProceed', 'openUri failed', { error })
    })
    closeModal()
  }, [registrationUrl, closeModal])

  const handleLearnMore = useCallback(() => {
    openUri({ uri: UniswapHelpUrls.articles.kycExplainer, openExternalBrowser: true, isSafeUri: true }).catch(
      (error: unknown) => {
        logger.warn('VerifyIdentityModal', 'handleLearnMore', 'openUri failed', { error })
      },
    )
  }, [])

  if (isMissingConfig) {
    return (
      <Modal
        name={ModalName.VerifyIdentity}
        isModalOpen={isOpen}
        onClose={closeModal}
        maxWidth={420}
        padding="$padding24"
      >
        <Flex gap="$spacing24" width="100%" data-testid={TestID.VerifyIdentityUnavailableModal}>
          <Flex row width="100%" justifyContent="flex-end" height="$spacing36" alignItems="center">
            <TouchableArea onPress={closeModal} aria-label="Close">
              <X size="$icon.24" color="$neutral2" />
            </TouchableArea>
          </Flex>
          <Flex gap="$spacing16" alignItems="center" width="100%">
            <Flex
              alignItems="center"
              justifyContent="center"
              backgroundColor="$surface3"
              borderRadius="$rounded12"
              width="$spacing48"
              height="$spacing48"
            >
              <AlertTriangleFilled size="$icon.24" color="$neutral2" />
            </Flex>
            <Flex gap="$spacing8" alignItems="center" width="100%">
              <Text variant="subheading1" color="$neutral1" textAlign="center">
                {t('permissionedPool.verifyIdentity.unavailable.title')}
              </Text>
              <Text variant="body2" color="$neutral2" textAlign="center">
                {t('permissionedPool.verifyIdentity.unavailable.description', { tokenSymbol })}
              </Text>
            </Flex>
          </Flex>
          <Flex row width="100%">
            <Button size="medium" variant="default" emphasis="primary" onPress={closeModal}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    )
  }

  return (
    <Modal
      name={ModalName.VerifyIdentity}
      isModalOpen={isOpen}
      onClose={closeModal}
      maxWidth={420}
      // Use `padding` (not paddingX/pt/pb) so it survives Modal.web.tsx's `$md` breakpoint override,
      // which only respects the `padding` prop and otherwise collapses to 12px on mobile-web.
      padding="$padding24"
    >
      <Flex gap="$spacing24" width="100%" data-testid={TestID.VerifyIdentityModal}>
        <Flex row width="100%" justifyContent="flex-end" height="$spacing36" alignItems="center">
          <TouchableArea onPress={closeModal} aria-label="Close">
            <X size="$icon.24" color="$neutral2" />
          </TouchableArea>
        </Flex>
        <Flex gap="$spacing16" alignItems="center" width="100%">
          <Flex
            alignItems="center"
            justifyContent="center"
            backgroundColor="$surface3"
            borderRadius="$rounded12"
            width="$spacing48"
            height="$spacing48"
          >
            <UserCheck size="$icon.24" color="$neutral1" />
          </Flex>
          <Flex gap="$spacing8" alignItems="center" width="100%">
            <Text variant="subheading1" color="$neutral1" textAlign="center">
              {t('permissionedPool.verifyIdentity.title')}
            </Text>
            <Text variant="body2" color="$neutral2" textAlign="center">
              {t('permissionedPool.verifyIdentity.description', { tokenSymbol, provider: issuer ?? '' })}
            </Text>
            <TouchableArea onPress={handleLearnMore}>
              <Text variant="buttonLabel3" color="$neutral1">
                {t('permissionedPool.verifyIdentity.learnMore')}
              </Text>
            </TouchableArea>
          </Flex>
        </Flex>
        <Flex gap="$spacing8" width="100%">
          <Flex row width="100%">
            <Button
              size="medium"
              variant="default"
              emphasis="primary"
              onPress={handleProceed}
              icon={<ExternalLink size="$icon.20" />}
              iconPosition="after"
              data-testid={TestID.VerifyIdentityButton}
            >
              {t('permissionedPool.verifyIdentity.proceedCta')}
            </Button>
          </Flex>
          <Text variant="body5" color="$neutral3" textAlign="center">
            {t('permissionedPool.verifyIdentity.disclaimer', { provider: issuer ?? '' })}
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}
