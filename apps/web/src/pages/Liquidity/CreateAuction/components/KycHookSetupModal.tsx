import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Flex,
  HeightAnimator,
  Input,
  ModalCloseIcon,
  Separator,
  SpinningLoader,
  Text,
  TouchableArea,
} from 'ui/src'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { fonts } from 'ui/src/theme/fonts'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { TransactionRequestDetails } from 'uniswap/src/components/transactions/requests/TransactionRequestDetails'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { isAddress, zeroAddress } from '~/chains'
import { ExternalLink } from '~/theme/components/Links'

const MOCK_KYC_HOOK_VALIDATION_ADDRESS = '0x1234567890123456789012345678901234567891'
type KycPreviewMeta = { functionName: string; contractName: string; rawDataPreview: string }
type Phase = 'enter' | 'validating' | 'preview'

export function KycHookSetupModal({
  isOpen,
  onClose,
  chainId,
  initialAddress,
  onAccepted,
}: {
  isOpen: boolean
  onClose: () => void
  chainId: UniverseChainId
  initialAddress?: string
  onAccepted: (address: string) => void
}) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<Phase>('enter')
  const [draftAddress, setDraftAddress] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [previewMeta, setPreviewMeta] = useState<KycPreviewMeta | null>(null)
  const [detailsExpanded, setDetailsExpanded] = useState(true)
  const modalSessionRef = useRef(0)

  useEffect(() => {
    modalSessionRef.current += 1
    if (isOpen) {
      setPhase('enter')
      setDraftAddress(initialAddress ?? '')
      setSubmitError(null)
      setPreviewMeta(null)
      setDetailsExpanded(true)
    }
  }, [isOpen, initialAddress])

  const trimmedAddress = draftAddress.trim()
  const canSubmitEnter = isAddress(trimmedAddress)

  const handleValidateEnter = useCallback(async () => {
    if (!isAddress(trimmedAddress)) {
      return
    }
    setSubmitError(null)
    setPhase('validating')
    const sessionAtStart = modalSessionRef.current
    await new Promise((r) => setTimeout(r, 1200))
    if (sessionAtStart !== modalSessionRef.current) {
      return
    }
    if (
      areAddressesEqual({
        addressInput1: { address: trimmedAddress, chainId },
        addressInput2: { address: zeroAddress, chainId },
      })
    ) {
      setPhase('enter')
      setSubmitError(t('toucan.createAuction.step.configureAuction.kyc.modal.error.validationFailed'))
      return
    }
    setPreviewMeta({
      functionName: 'onKycValidation',
      contractName: 'KYC hook',
      rawDataPreview: trimmedAddress,
    })
    setPhase('preview')
  }, [chainId, trimmedAddress, t])

  const handleConfirmPreview = useCallback(() => {
    if (!isAddress(trimmedAddress)) {
      return
    }
    onAccepted(trimmedAddress)
    onClose()
  }, [trimmedAddress, onAccepted, onClose])

  return (
    <Modal
      name={ModalName.AuctionKycHookSetup}
      onClose={onClose}
      isModalOpen={isOpen}
      analyticsProperties={{ chainId, phase }}
      padding={0}
    >
      <HeightAnimator>
        <Flex gap="$spacing24" px="$spacing24" pb="$spacing24" pt="$spacing16" maxWidth={420} mx="auto" width="100%">
          <Flex row height={36} alignItems="center" justifyContent="flex-end" width="100%">
            <ModalCloseIcon role="none" onClose={onClose} />
          </Flex>

          <Flex alignItems="center" width="100%">
            <Flex
              width={48}
              height={48}
              borderRadius="$rounded12"
              backgroundColor="$surface3"
              alignItems="center"
              justifyContent="center"
            >
              <UserCheck color="$neutral1" size="$icon.24" />
            </Flex>
          </Flex>

          {phase === 'validating' ? (
            <Flex gap="$spacing20" alignItems="center" py="$spacing16" width="100%">
              <SpinningLoader size={32} color="$neutral2" />
              <Text variant="body2" color="$neutral2" textAlign="center">
                {t('toucan.createAuction.step.configureAuction.kyc.modal.validating')}
              </Text>
            </Flex>
          ) : (
            <Flex gap="$spacing16" alignItems="center" width="100%">
              <Flex gap="$spacing8" alignItems="center" width="100%">
                <Text variant="subheading1" color="$neutral1" textAlign="center">
                  {t('toucan.createAuction.step.configureAuction.kyc.modal.title')}
                </Text>
                <Text variant="body2" color="$neutral2" textAlign="center" lineHeight={20}>
                  {t('toucan.createAuction.step.configureAuction.kyc.modal.description')}
                </Text>

                {phase === 'enter' ? (
                  <Flex
                    row
                    alignItems="center"
                    width="100%"
                    minHeight={48}
                    px="$spacing16"
                    py="$spacing8"
                    backgroundColor="$surface2"
                    borderWidth={1}
                    borderColor={submitError ? '$statusCritical' : '$surface3'}
                    borderRadius="$rounded16"
                  >
                    <Input
                      flex={1}
                      value={draftAddress}
                      onChangeText={(text) => {
                        setDraftAddress(text)
                        if (submitError) {
                          setSubmitError(null)
                        }
                      }}
                      placeholder={shortenAddress({ address: MOCK_KYC_HOOK_VALIDATION_ADDRESS, chars: 6 })}
                      placeholderTextColor="$neutral3"
                      height={fonts.subheading2.lineHeight}
                      fontSize={fonts.subheading2.fontSize}
                      lineHeight={fonts.subheading2.lineHeight}
                      fontWeight={fonts.subheading2.fontWeight}
                      color="$neutral1"
                      px="$none"
                      backgroundColor="$transparent"
                    />
                  </Flex>
                ) : previewMeta ? (
                  <Flex
                    width="100%"
                    backgroundColor="$surface2"
                    borderWidth={1}
                    borderColor="$surface3"
                    borderRadius="$rounded16"
                    overflow="hidden"
                    pt="$spacing16"
                    pb="$spacing12"
                    gap="$spacing12"
                  >
                    <Flex px="$spacing16" width="100%" minWidth={0} $platform-web={{ overflowX: 'auto' }}>
                      <Text variant="body2" color="$neutral1" textAlign="center" fontSize={14}>
                        {trimmedAddress}
                      </Text>
                    </Flex>

                    <Flex px="$spacing16" width="100%" gap="$spacing12">
                      <Separator width="100%" />
                      <TouchableArea onPress={() => setDetailsExpanded((v) => !v)}>
                        <Flex row alignItems="center" justifyContent="space-between" width="100%">
                          <Flex row alignItems="center" gap="$spacing8">
                            <DocumentList color="$neutral2" size="$icon.16" />
                            <Text variant="buttonLabel3" color="$neutral2">
                              {detailsExpanded ? t('dapp.transaction.details.hide') : t('common.button.viewDetails')}
                            </Text>
                          </Flex>
                          <RotatableChevron
                            color="$neutral2"
                            size="$icon.16"
                            direction={detailsExpanded ? 'up' : 'down'}
                          />
                        </Flex>
                      </TouchableArea>

                      {detailsExpanded && (
                        <TransactionRequestDetails
                          functionName={previewMeta.functionName}
                          contractName={previewMeta.contractName}
                          contractAddress={trimmedAddress}
                          rawData={previewMeta.rawDataPreview}
                          chainId={chainId}
                        />
                      )}
                    </Flex>
                  </Flex>
                ) : null}

                {submitError ? (
                  <Text variant="body4" color="$statusCritical" textAlign="center">
                    {submitError}
                  </Text>
                ) : null}

                <ExternalLink href="https://support.uniswap.org/hc/en-us">
                  <Text variant="buttonLabel3" color="$accent3" textAlign="center">
                    {t('toucan.createAuction.step.configureAuction.kyc.modal.helpLink')}
                  </Text>
                </ExternalLink>
              </Flex>

              <Flex row gap="$spacing8" width="100%">
                <Button size="small" emphasis="secondary" minHeight="$spacing36" fill onPress={onClose}>
                  {t('common.button.cancel')}
                </Button>
                <Button
                  size="small"
                  emphasis="primary"
                  minHeight="$spacing36"
                  fill
                  isDisabled={!canSubmitEnter}
                  onPress={phase === 'preview' ? handleConfirmPreview : handleValidateEnter}
                >
                  <Text variant="buttonLabel3" color="$surface1">
                    {phase === 'enter'
                      ? t('toucan.createAuction.step.configureAuction.kyc.modal.cta.validate')
                      : t('common.button.confirm')}
                  </Text>
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </HeightAnimator>
    </Modal>
  )
}
