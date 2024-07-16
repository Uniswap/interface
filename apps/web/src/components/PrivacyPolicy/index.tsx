import { SharedEventName } from '@uniswap/analytics-events'
import Card, { DarkGrayCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { useEffect, useRef } from 'react'
import { ArrowDown, Info, X } from 'react-feather'
import { useModalIsOpen, useTogglePrivacyPolicy } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ExternalLink, ThemedText } from 'theme/components'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isMobile } from 'utilities/src/platform'

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

const HoverText = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.neutral1};
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const StyledLinkOut = styled(ArrowDown)`
  transform: rotate(230deg);
`

const EXTERNAL_APIS = [
  {
    name: 'Auto Router',
    description: <Trans i18nKey="privacy.autoRouter" />,
  },
  {
    name: 'Infura',
    description: <Trans i18nKey="privacy.infura" />,
  },
  {
    name: 'TRM Labs',
    description: (
      <>
        <Trans i18nKey="privacy.trm" />{' '}
        <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/8671777747597-Address-Screening-Guide">
          <Trans i18nKey="common.learnMore.link" />
        </ExternalLink>
      </>
    ),
  },
  {
    name: 'Google Analytics & Amplitude',
    description: <Trans i18nKey="privacy.anonymizedLogs" />,
  },
]

export function PrivacyPolicyModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(ApplicationModal.PRIVACY_POLICY)
  const toggle = useTogglePrivacyPolicy()

  useEffect(() => {
    if (!open) {
      return
    }

    sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
      modal: ModalName.Legal,
    })
  }, [open])

  return (
    <Modal isOpen={open} onDismiss={() => toggle()}>
      <AutoColumn gap="md" ref={node as any}>
        <RowBetween padding="1rem 1rem 0.5rem 1rem">
          <ThemedText.DeprecatedMediumHeader>
            <Trans i18nKey="common.legalAndPrivacy" />
          </ThemedText.DeprecatedMediumHeader>
          <HoverText onClick={() => toggle()}>
            <X size={24} />
          </HoverText>
        </RowBetween>
        <PrivacyPolicy />
      </AutoColumn>
    </Modal>
  )
}

function PrivacyPolicy() {
  return (
    <Wrapper
      draggable="true"
      onTouchMove={(e) => {
        // prevent modal gesture handler from dismissing modal when content is scrolling
        if (isMobile) {
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
                    <Trans i18nKey="privacy.uniswaptos" />
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
                    <Trans i18nKey="common.privacyPolicy" />
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
        </AutoColumn>
        <ThemedText.DeprecatedMain fontSize={14}>
          <Trans i18nKey="privacy.thirdPartyApis" />
        </ThemedText.DeprecatedMain>
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
                <Trans i18nKey="common.learnMore.link" />
              </ExternalLink>
            </Row>
          </ThemedText.DeprecatedBody>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
