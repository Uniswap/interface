import { Trans } from '@lingui/macro'
import Card, { DarkGreyCard } from 'components/Card'
import { AutoRow, RowBetween } from 'components/Row'
import { useEffect, useRef } from 'react'
import { ArrowDown, Info, X } from 'react-feather'
import ReactGA from 'react-ga'
import styled from 'styled-components/macro'
import { ExternalLink, TYPE } from 'theme'

import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'
import { useModalOpen, useTogglePrivacyPolicy } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { AutoColumn } from '../Column'
import Modal from '../Modal'

const GrayscaleRouterLogo = styled(AutoRouterIcon)`
  filter: grayscale(1);
  height: 15px;
  width: 15px;
`

const Wrapper = styled.div`
  padding: 0 1rem;
`

const StyledExternalCard = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  padding: 0.5rem;
  width: 100%;

  :hover,
  :focus,
  :active {
    background-color: ${({ theme }) => theme.primary4};
  }
`

const Header = styled.div`
  flex: 1;
  text-align: center;
`

const HoverText = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.text1};
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
    icon: <GrayscaleRouterLogo />,
    description: (
      <Trans>
        The app fetches the optimal trade route from a Uniswap Labs server. Your IP address is shared. You may disable
        this in settings.
      </Trans>
    ),
  },
  {
    name: <Trans>Infura API</Trans>,
    description: (
      <Trans>
        The app fetches on chain data and constructs contract calls with an Infura API. Your wallet address and IP
        address are shared.
      </Trans>
    ),
  },
  {
    name: <Trans>Google Analytics</Trans>,
    description: <Trans>The app logs anonymized usage statistics in order to improve the app over time.</Trans>,
  },
  {
    name: <Trans>The Graph</Trans>,
    description: <Trans>The app fetches blockchain data from The Graph’s hosted service.</Trans>,
  },
]

export function PrivacyPolicyModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.PRIVACY_POLICY)
  const toggle = useTogglePrivacyPolicy()

  useEffect(() => {
    ReactGA.event({
      category: 'Modals',
      action: 'Privacy and terms',
    })
  }, [])

  return (
    <Modal isOpen={open} onDismiss={() => toggle()}>
      <AutoColumn gap="12px" ref={node as any}>
        <RowBetween padding="1rem 1rem 0.5rem 1rem">
          <Header>
            <TYPE.mediumHeader flex="1">
              <Trans>Privacy</Trans>
            </TYPE.mediumHeader>
          </Header>
          <HoverText onClick={() => toggle()}>
            <X size={18} />
          </HoverText>
        </RowBetween>
        <PrivacyPolicy />
      </AutoColumn>
    </Modal>
  )
}

export function PrivacyPolicy() {
  return (
    <Wrapper>
      <AutoColumn justify="center" gap="16px">
        <AutoColumn gap="4px">
          <TYPE.black fontSize={14}>
            <Trans>Uniswap privacy protection</Trans>
          </TYPE.black>
          <TYPE.main fontSize={14}>
            <Trans>This webapp stores no cookies, nor does it track or detect your IP address.</Trans>
          </TYPE.main>
        </AutoColumn>
        <AutoColumn gap="8px" style={{ width: '100%' }}>
          <StyledExternalCard>
            <ExternalLink href={'https://uniswap.org/terms-of-service'}>
              <RowBetween>
                <AutoRow gap="4px">
                  <Info size={20} />
                  <TYPE.main fontSize={14} color={'primaryText1'}>
                    <Trans>Terms of Service</Trans>
                  </TYPE.main>
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
                  <TYPE.main fontSize={14} color={'primaryText1'}>
                    <Trans>Protocol Disclaimer</Trans>
                  </TYPE.main>
                </AutoRow>
                <StyledLinkOut size={20} />
              </RowBetween>
            </ExternalLink>
          </StyledExternalCard>
        </AutoColumn>
        <AutoColumn gap="12px">
          {EXTERNAL_APIS.map(({ name, icon, description }, i) => (
            <DarkGreyCard key={i}>
              <AutoColumn gap="8px">
                <AutoRow gap="4px">
                  {icon ?? <Info size={18} />}
                  <TYPE.main fontSize={14} color={'text1'}>
                    {name}
                  </TYPE.main>
                </AutoRow>
                <TYPE.main fontSize={14}>{description}</TYPE.main>
              </AutoColumn>
            </DarkGreyCard>
          ))}
          <div />
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}
