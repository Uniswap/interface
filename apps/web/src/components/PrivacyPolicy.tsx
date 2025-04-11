import { SharedEventName } from '@uniswap/analytics-events'
import Card, { DarkGrayCard } from 'components/Card/cards'
import { AutoColumn } from 'components/deprecated/Column'
import Row, { AutoRow, RowBetween } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useEffect, useMemo, useRef } from 'react'
import { ArrowDown, Info } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { ModalCloseIcon } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isMobileWeb } from 'utilities/src/platform'

const Wrapper = styled.div`
  max-height: 70vh;
  overflow: auto;
  padding: 0 1rem;
`

const StyledExternalCard = styled(Card)`
  background-color: ${({ theme }) => theme.accent2};
  padding: 0.5rem;
  width: 100%;

  :hover,
  :focus,
  :active {
    background-color: ${({ theme }) => theme.neutral3};
  }
`

const StyledLinkOut = styled(ArrowDown)`
  transform: rotate(230deg);
`

export function PrivacyPolicyModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(ApplicationModal.PRIVACY_POLICY)
  const closeModal = useCloseModal(ApplicationModal.PRIVACY_POLICY)
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) {
      return
    }

    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      modal: ModalName.Legal,
    })
  }, [open])

  return (
    <Modal name={ModalName.Legal} isModalOpen={open} onClose={() => closeModal()} padding={0}>
      <AutoColumn gap="md" ref={node as any}>
        <RowBetween padding="1rem 1rem 0.5rem 1rem">
          <ThemedText.DeprecatedMediumHeader>{t('common.legalAndPrivacy')}</ThemedText.DeprecatedMediumHeader>
          <ModalCloseIcon onClose={closeModal} />
        </RowBetween>
        <PrivacyPolicy />
      </AutoColumn>
    </Modal>
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
    <Wrapper
      draggable="true"
      onTouchMove={(e) => {
        // prevent modal gesture handler from dismissing modal when content is scrolling
        if (isMobileWeb) {
          e.stopPropagation()
        }
      }}
    >
      <AutoColumn gap="16px">
        <AutoColumn gap="sm" style={{ width: '100%' }}>
          <StyledExternalCard>
            <ExternalLink href="https://uniswap.org/terms-of-service">
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <ThemedText.DeprecatedMain fontSize={14} color="accent1">
                    {t('privacy.uniswaptos')}
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
          <StyledExternalCard>
            <ExternalLink href="https://uniswap.org/privacy-policy/">
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <ThemedText.DeprecatedMain fontSize={14} color="accent1">
                    {t('common.privacyPolicy')}
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
        </AutoColumn>
        <ThemedText.DeprecatedMain fontSize={14}>{t('privacy.thirdPartyApis')}</ThemedText.DeprecatedMain>
        <AutoColumn gap="md">
          {EXTERNAL_APIS.map(({ name, description }, i) => (
            <DarkGrayCard key={i}>
              <AutoColumn gap="sm">
                <AutoRow gap="4px">
                  <Info size={18} />
                  <ThemedText.DeprecatedMain fontSize={14} color="neutral1">
                    {name}
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <ThemedText.DeprecatedMain fontSize={14}>{description}</ThemedText.DeprecatedMain>
              </AutoColumn>
            </DarkGrayCard>
          ))}
          <ThemedText.DeprecatedBody fontSize={12}>
            <Row justify="center" marginBottom="1rem">
              <ExternalLink href="https://help.uniswap.org/en/articles/5675203-terms-of-service-faq">
                {t('common.button.learn')}
              </ExternalLink>
            </Row>
          </ThemedText.DeprecatedBody>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
