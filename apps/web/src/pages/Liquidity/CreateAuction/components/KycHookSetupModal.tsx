import { ValidationType } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Code } from 'ui/src/components/icons/Code'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { ExternalLink as ExternalLinkIcon } from 'ui/src/components/icons/ExternalLink'
import { Page } from 'ui/src/components/icons/Page'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { UserCheck } from 'ui/src/components/icons/UserCheck'
import { fonts } from 'ui/src/theme/fonts'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { AuctionQueryClient } from 'uniswap/src/data/apiClients/liquidityService/AuctionQueryClient'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { shortenAddress, shortenHash } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { isAddress } from '~/chains'
import { ExternalLink } from '~/theme/components/Links'

const KYC_HOOK_PLACEHOLDER_ADDRESS = '0x1234567890123456789012345678901234567891'
type KycPreview = { hookName: string; interfaceId: string }
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
  const [preview, setPreview] = useState<KycPreview | null>(null)
  const [detailsExpanded, setDetailsExpanded] = useState(true)
  const modalSessionRef = useRef(0)

  useEffect(() => {
    modalSessionRef.current += 1
    if (isOpen) {
      setPhase('enter')
      setDraftAddress(initialAddress ?? '')
      setSubmitError(null)
      setPreview(null)
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
    const validationFailedMessage = t('toucan.createAuction.step.configureAuction.kyc.modal.error.validationFailed')

    try {
      const response = await AuctionQueryClient.validateAuctionHook({
        hookAddress: trimmedAddress,
        chainId: Number(chainId),
        hookType: ValidationType.KYC_VERIFICATION,
      })

      if (sessionAtStart !== modalSessionRef.current) {
        return
      }

      const result = response.results.find((r) => r.hookType === ValidationType.KYC_VERIFICATION)
      if (!response.isContract || !result || !result.supported) {
        setPhase('enter')
        setSubmitError(validationFailedMessage)
        return
      }

      setPreview({ hookName: result.hookName, interfaceId: result.interfaceId })
      setPhase('preview')
    } catch (e) {
      if (sessionAtStart !== modalSessionRef.current) {
        return
      }
      logger.error(e, { tags: { file: 'KycHookSetupModal', function: 'handleValidateEnter' } })
      setPhase('enter')
      setSubmitError(validationFailedMessage)
    }
  }, [chainId, trimmedAddress, t])

  const handleConfirmPreview = useCallback(() => {
    if (!isAddress(trimmedAddress)) {
      return
    }
    onAccepted(trimmedAddress)
    onClose()
  }, [trimmedAddress, onAccepted, onClose])

  const explorerLink = useMemo(
    () =>
      getExplorerLink({
        chainId,
        data: trimmedAddress,
        type: ExplorerDataType.ADDRESS,
      }),
    [chainId, trimmedAddress],
  )

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
                    <Trace logFocus element={ElementName.AuctionValidationHookAddress}>
                      <Input
                        flex={1}
                        value={draftAddress}
                        onChangeText={(text) => {
                          setDraftAddress(text)
                          if (submitError) {
                            setSubmitError(null)
                          }
                        }}
                        placeholder={shortenAddress({ address: KYC_HOOK_PLACEHOLDER_ADDRESS, chars: 6 })}
                        placeholderTextColor="$neutral3"
                        height={fonts.subheading2.lineHeight}
                        fontSize={fonts.subheading2.fontSize}
                        lineHeight={fonts.subheading2.lineHeight}
                        fontWeight={fonts.subheading2.fontWeight}
                        color="$neutral1"
                        px="$none"
                        backgroundColor="$transparent"
                      />
                    </Trace>
                  </Flex>
                ) : preview ? (
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
                        <Flex gap="$spacing12">
                          <Flex row alignItems="center" justifyContent="space-between" height={16}>
                            <Flex row gap="$spacing8" alignItems="center">
                              <Page color="$neutral2" size="$icon.16" />
                              <Text color="$neutral2" variant="body4">
                                {t('common.text.contract')}
                              </Text>
                            </Flex>
                            <ExternalLink
                              href={explorerLink}
                              style={{ textDecoration: 'none', color: 'inherit', stroke: 'inherit' }}
                            >
                              <Flex row gap="$spacing4" alignItems="center">
                                <Text color="$neutral1" verticalAlign="center" variant="body4">
                                  {preview.hookName}
                                </Text>
                                <ExternalLinkIcon color="$neutral2" size="$icon.12" />
                              </Flex>
                            </ExternalLink>
                          </Flex>

                          <Flex row alignItems="center" justifyContent="space-between" height={16}>
                            <Flex row gap="$spacing8" alignItems="center">
                              <Code color="$neutral2" size="$icon.16" />
                              <Text color="$neutral2" variant="body4">
                                {t('toucan.createAuction.step.configureAuction.kyc.modal.interfaceId')}
                              </Text>
                            </Flex>
                            <CopyHelper
                              toCopy={preview.interfaceId}
                              iconSize={16}
                              iconPosition="right"
                              color="$neutral1"
                            >
                              <Text color="$neutral1" variant="body4">
                                {preview.interfaceId.length > 12
                                  ? shortenHash(preview.interfaceId, 4)
                                  : preview.interfaceId}
                              </Text>
                            </CopyHelper>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  </Flex>
                ) : null}

                {submitError ? (
                  <Text variant="body4" color="$statusCritical" textAlign="center">
                    {submitError}
                  </Text>
                ) : null}

                <ExternalLink href={UniswapHelpUrls.articles.toucanLaunchAuctionConfigureAuctionHelp}>
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
                  disabled={!canSubmitEnter}
                  onPress={phase === 'preview' ? handleConfirmPreview : handleValidateEnter}
                >
                  {phase === 'enter'
                    ? t('toucan.createAuction.step.configureAuction.kyc.modal.cta.validate')
                    : t('common.button.confirm')}
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </HeightAnimator>
    </Modal>
  )
}
