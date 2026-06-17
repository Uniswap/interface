import { SharedEventName } from '@uniswap/analytics-events'
import { isMobileWeb } from '@universe/environment'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Card, DarkGrayCard } from '~/components/Card/cards'
import { useModalState } from '~/hooks/useModalState'
import { ExternalLink } from '~/theme/components/Links'

export function PrivacyPolicyModal() {
  const node = useRef<HTMLDivElement>(undefined)
  const { isOpen, closeModal } = useModalState(ModalName.PrivacyPolicy)
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      modal: ModalName.Legal,
    })
  }, [isOpen])

  return (
    <Modal name={ModalName.Legal} isModalOpen={isOpen} onClose={() => closeModal()} padding={0}>
      <Flex gap="$gap12" ref={node as never}>
        <Flex row width="100%" justifyContent="space-between" alignItems="center" p="$spacing16" pb="$spacing8">
          <Text variant="subheading1">{t('common.legalAndPrivacy')}</Text>
          <ModalCloseIcon onClose={closeModal} />
        </Flex>
        <PrivacyPolicy />
      </Flex>
    </Modal>
  )
}

function ExternalLinkCard({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <Card
        backgroundColor="$accent2"
        width="100%"
        cursor="pointer"
        hoverStyle={{ opacity: 0.8 }}
        pressStyle={{ opacity: 0.7 }}
      >
        <Flex row width="100%" justifyContent="space-between" alignItems="center">
          <Flex row flexWrap="wrap" gap="$gap4" alignItems="center">
            <InfoCircle size="$icon.20" color="$accent1" strokeWidth={0} />
            <Text variant="body3" color="$accent1">
              {children}
            </Text>
          </Flex>
          <ArrowUpRight size="$icon.20" strokeWidth={0} color="$neutral2" />
        </Flex>
      </Card>
    </a>
  )
}

function PrivacyPolicy() {
  const { t } = useTranslation()
  const EXTERNAL_APIS = useMemo(
    () => [
      {
        name: 'Auto Router',
        description: t('privacy.autoRouter'),
      },
      {
        name: 'Infura',
        description: t('privacy.infura'),
      },
      {
        name: 'TRM Labs',
        description: (
          <>
            {t('privacy.trm')}{' '}
            <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8671777747597-Address-Screening-Guide">
              {t('common.button.learn')}
            </ExternalLink>
          </>
        ),
      },
      {
        name: 'Google Analytics & Amplitude',
        description: t('privacy.anonymizedLogs'),
      },
    ],
    [t],
  )

  return (
    <Flex
      maxHeight="70vh"
      $platform-web={{ overflow: 'auto' }}
      px="$spacing16"
      onTouchMove={(e) => {
        // prevent modal gesture handler from dismissing modal when content is scrolling
        if (isMobileWeb) {
          e.stopPropagation()
        }
      }}
    >
      <Flex gap="$spacing16">
        <Flex gap="$gap8" width="100%">
          <ExternalLinkCard href={UniswapStaticUrls.termsOfServiceUrl}>{t('privacy.uniswaptos')}</ExternalLinkCard>
          <ExternalLinkCard href={UniswapStaticUrls.privacyPolicyUrl}>{t('common.privacyPolicy')}</ExternalLinkCard>
        </Flex>
        <Text variant="body3" color="$neutral2">
          {t('privacy.thirdPartyApis')}
        </Text>
        <Flex gap="$gap12" width="100%">
          {EXTERNAL_APIS.map(({ name, description }, i) => (
            <DarkGrayCard key={i}>
              <Flex gap="$gap8" width="100%">
                <Flex row flexWrap="wrap" gap="$gap4" alignItems="center">
                  <InfoCircle size="$icon.18" color="$neutral1" />
                  <Text variant="body3" color="$neutral1">
                    {name}
                  </Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {description}
                </Text>
              </Flex>
            </DarkGrayCard>
          ))}
          <Flex row width="100%" justifyContent="center" mb="$spacing16">
            <ExternalLink
              href="https://help.uniswap.org/en/articles/5675203-terms-of-service-faq"
              style={{ fontSize: 12 }}
            >
              {t('common.button.learn')}
            </ExternalLink>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default PrivacyPolicyModal
