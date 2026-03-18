import { SharedEventName } from '@uniswap/analytics-events'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isMobileWeb } from 'utilities/src/platform'
import Card, { DarkGrayCard } from '~/components/Card/cards'
import { AutoColumn } from '~/components/deprecated/Column'
import Row, { AutoRow, RowBetween } from '~/components/deprecated/Row'
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
      <AutoColumn gap="md" ref={node as any}>
        <RowBetween padding="1rem 1rem 0.5rem 1rem">
          <Text variant="subheading1">{t('common.legalAndPrivacy')}</Text>
          <ModalCloseIcon onClose={closeModal} />
        </RowBetween>
        <PrivacyPolicy />
      </AutoColumn>
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
        <RowBetween>
          <AutoRow gap="4px">
            <InfoCircle size="$icon.20" color="$accent1" strokeWidth={0} />
            <Text variant="body3" color="$accent1">
              {children}
            </Text>
          </AutoRow>
          <ArrowUpRight size="$icon.20" strokeWidth={0} color="$neutral2" />
        </RowBetween>
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
      <AutoColumn gap="16px">
        <AutoColumn gap="sm" style={{ width: '100%' }}>
          <ExternalLinkCard href="https://uniswap.org/terms-of-service">{t('privacy.uniswaptos')}</ExternalLinkCard>
          <ExternalLinkCard href="https://uniswap.org/privacy-policy/">{t('common.privacyPolicy')}</ExternalLinkCard>
        </AutoColumn>
        <Text variant="body3" color="$neutral2">
          {t('privacy.thirdPartyApis')}
        </Text>
        <AutoColumn gap="md">
          {EXTERNAL_APIS.map(({ name, description }, i) => (
            <DarkGrayCard key={i}>
              <AutoColumn gap="sm">
                <AutoRow gap="4px">
                  <InfoCircle size="$icon.18" color="$neutral1" />
                  <Text variant="body3" color="$neutral1">
                    {name}
                  </Text>
                </AutoRow>
                <Text variant="body3" color="$neutral2">
                  {description}
                </Text>
              </AutoColumn>
            </DarkGrayCard>
          ))}
          <Row justify="center" marginBottom="1rem">
            <ExternalLink
              href="https://help.uniswap.org/en/articles/5675203-terms-of-service-faq"
              style={{ fontSize: 12 }}
            >
              {t('common.button.learn')}
            </ExternalLink>
          </Row>
        </AutoColumn>
      </AutoColumn>
    </Flex>
  )
}
