import { Trans, useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UserLock } from 'ui/src/components/icons/UserLock'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'

interface KycInterstitialModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
  providerName?: string
  providerTermsUrl?: string
  providerPrivacyUrl?: string
}

export function KycInterstitialModal({
  isOpen,
  onClose,
  onContinue,
  providerName = 'Predicate',
  providerTermsUrl = 'https://predicate.io/terms-of-service',
  providerPrivacyUrl = 'https://predicate.io/privacy-policy',
}: KycInterstitialModalProps): JSX.Element {
  const { t } = useTranslation()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)

  return (
    <Modal name={ModalName.KycInterstitial} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
      <Flex position="relative" backgroundColor="$surface1" p="$spacing24" gap="$spacing24">
        <TouchableArea
          position="absolute"
          top="$spacing16"
          right="$spacing16"
          p="$spacing8"
          onPress={onClose}
          borderRadius="$rounded8"
          zIndex={2}
        >
          <X size="$icon.24" color="$neutral2" />
        </TouchableArea>

        <Flex gap="$spacing16" alignItems="center" pt="$spacing16">
          <Flex
            width={48}
            height={48}
            borderRadius="$rounded16"
            backgroundColor="$surface3"
            justifyContent="center"
            alignItems="center"
          >
            <UserLock size="$icon.24" color="$neutral1" />
          </Flex>

          <Flex gap="$spacing8" alignItems="center">
            <Text variant="subheading1" color="$neutral1" textAlign="center">
              {t('toucan.kyc.interstitial.title')}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {t('toucan.kyc.interstitial.description', {
                teamName: auctionDetails?.token?.currency.name,
                provider: providerName,
              })}
            </Text>
          </Flex>
        </Flex>

        <Flex gap="$spacing8" width="100%">
          {onContinue && (
            <Button
              fill={false}
              variant="default"
              emphasis="primary"
              size="medium"
              onPress={onContinue}
              width="100%"
              icon={<ExternalLink size="$icon.20" color="$surface1" />}
              iconPosition="after"
            >
              {t('toucan.kyc.interstitial.continue')}
            </Button>
          )}
          {providerName && providerTermsUrl && providerPrivacyUrl && (
            <Text variant="body4" color="$neutral2" textAlign="center">
              <Trans
                i18nKey="toucan.kyc.interstitial.disclaimer"
                values={{ providerName }}
                components={{
                  termsLink: (
                    <Anchor
                      fontSize="$micro"
                      lineHeight="$spacing12"
                      textDecorationLine="none"
                      color="$neutral2"
                      href={providerTermsUrl}
                      target="_blank"
                    />
                  ),
                  privacyLink: (
                    <Anchor
                      fontSize="$micro"
                      lineHeight="$spacing12"
                      textDecorationLine="none"
                      color="$neutral2"
                      href={providerPrivacyUrl}
                      target="_blank"
                    />
                  ),
                }}
              />
            </Text>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
