import { Trans } from '@lingui/macro'
import { sendEvent } from 'components/analytics'
import Card, { DarkGreyCard } from 'components/Card'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { useEffect, useRef } from 'react'
import { ArrowDown, Info, X } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { isMobile } from 'utils/userAgent'

import { useModalIsOpen, useTogglePrivacyPolicy } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { AutoColumn } from '../Column'
import Modal from '../Modal'

const Wrapper = styled.div`
  max-height: 70vh;
  overflow: auto;
  padding: 0 1rem;
`

const StyledExternalCard = styled(Card)`
  background-color: ${({ theme }) => theme.deprecated_primary5};
  padding: 0.5rem;
  width: 100%;

  :hover,
  :focus,
  :active {
    background-color: ${({ theme }) => theme.deprecated_primary4};
  }
`

const HoverText = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.deprecated_text1};
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
    description: <Trans>The app fetches the optimal trade route from a Uniswap Labs server.</Trans>,
  },
  {
    name: 'Infura',
    description: <Trans>The app fetches on-chain data and constructs contract calls with an Infura API.</Trans>,
  },
  {
    name: 'TRM Labs',
    description: (
      <>
        <Trans>
          The app securely collects your wallet address and shares it with TRM Labs Inc. for risk and compliance
          reasons.
        </Trans>{' '}
        <ExternalLink href="https://help.uniswap.org/en/articles/5675203-terms-of-service-faq">
          <Trans>Learn more</Trans>
        </ExternalLink>
      </>
    ),
  },
  {
    name: 'Google Analytics & Amplitude',
    description: <Trans>The app logs anonymized usage statistics in order to improve over time.</Trans>,
  },
  {
    name: 'The Graph',
    description: <Trans>The app fetches blockchain data from The Graph’s hosted service.</Trans>,
  },
]

export function PrivacyPolicyModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(ApplicationModal.PRIVACY_POLICY)
  const toggle = useTogglePrivacyPolicy()

  useEffect(() => {
    if (!open) return

    sendEvent({
      category: 'Modal',
      action: 'Show Legal',
    })
  }, [open])

  return (
    <Modal isOpen={open} onDismiss={() => toggle()}>
      <AutoColumn gap="12px" ref={node as any}>
        <RowBetween padding="1rem 1rem 0.5rem 1rem">
          <ThemedText.DeprecatedMediumHeader>
            <Trans>Legal & Privacy</Trans>
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

export function PrivacyPolicy() {
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
        <AutoColumn gap="8px" style={{ width: '100%' }}>
          <StyledExternalCard>
            <ExternalLink href={'https://uniswap.org/terms-of-service'}>
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <ThemedText.DeprecatedMain fontSize={14} color={'deprecated_primaryText1'}>
                    <Trans>Uniswap Labs&apos; Terms of Service</Trans>
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
          <StyledExternalCard>
            <ExternalLink href={'https://uniswap.org/disclaimer/'}>
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <ThemedText.DeprecatedMain fontSize={14} color={'deprecated_primaryText1'}>
                    <Trans>Protocol Disclaimer</Trans>
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
        </AutoColumn>
        <ThemedText.DeprecatedMain fontSize={14}>
          <Trans>This app uses the following third-party APIs:</Trans>
        </ThemedText.DeprecatedMain>
        <AutoColumn gap="12px">
          {EXTERNAL_APIS.map(({ name, description }, i) => (
            <DarkGreyCard key={i}>
              <AutoColumn gap="8px">
                <AutoRow gap="4px">
                  <Info size={18} />
                  <ThemedText.DeprecatedMain fontSize={14} color={'deprecated_text1'}>
                    {name}
                  </ThemedText.DeprecatedMain>
                </AutoRow>
                <ThemedText.DeprecatedMain fontSize={14}>{description}</ThemedText.DeprecatedMain>
              </AutoColumn>
            </DarkGreyCard>
          ))}
          <ThemedText.DeprecatedBody fontSize={12}>
            <Row justify="center" marginBottom="1rem">
              <ExternalLink href="https://help.uniswap.org/en/articles/5675203-terms-of-service-faq">
                <Trans>Learn more</Trans>
              </ExternalLink>
            </Row>
          </ThemedText.DeprecatedBody>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
