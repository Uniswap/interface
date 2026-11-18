import { Anchor, Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { UserLock } from '@universe/mycelium/icons/UserLock'
import { X } from '@universe/mycelium/icons/X'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { KycProvider } from 'uniswap/src/data/apiClients/dataApiService/auctions/useVerifyWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { KYC_PROVIDER_INFO } from '~/features/Toucan/Shared/kycProviders'

interface KycInterstitialModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
  kycProvider?: KycProvider
}

export function KycInterstitialModal({
  isOpen,
  onClose,
  onContinue,
  kycProvider = KycProvider.Predicate,
}: KycInterstitialModalProps): JSX.Element {
  const { t } = useTranslation()
  const {
    name: providerName,
    termsUrl: providerTermsUrl,
    privacyUrl: providerPrivacyUrl,
  } = KYC_PROVIDER_INFO[kycProvider]
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
                teamName: auctionDetails?.token?.currency.name ?? t('common.token'),
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
          <Text variant="body4" color="$neutral2" textAlign="center">
            <Trans
              i18nKey="toucan.kyc.interstitial.disclaimer"
              values={{ providerName }}
              components={{
                termsLink: (
                  <Anchor
                    fontSize="$micro"
                    lineHeight={12}
                    textDecorationLine="none"
                    color="$neutral2"
                    href={providerTermsUrl}
                    target="_blank"
                  />
                ),
                privacyLink: (
                  <Anchor
                    fontSize="$micro"
                    lineHeight={12}
                    textDecorationLine="none"
                    color="$neutral2"
                    href={providerPrivacyUrl}
                    target="_blank"
                  />
                ),
              }}
            />
          </Text>
        </Flex>
      </Flex>
    </Modal>
  )
}
