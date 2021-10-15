import { Trans } from '@lingui/macro'
import Card, { DarkGreyCard } from 'components/Card'
import { AutoRow, RowBetween } from 'components/Row'
import { useEffect } from 'react'
import { ArrowDown, Info, X } from 'react-feather'
import ReactGA from 'react-ga'
import styled from 'styled-components/macro'
import { ExternalLink, TYPE } from 'theme'

import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'
import { useModalOpen } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { AutoColumn } from '../Column'

const GrayscaleRouterLogo = styled(AutoRouterIcon)`
  filter: grayscale(1);
  height: 15px;
  width: 15px;
`

const Wrapper = styled.div`
  width: 375px;
  max-height: 455px;
`

const OverflowWrapper = styled.div`
  height: 300px;
  overflow-y: scroll;
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.bg1};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.primary1};
  }
`

const StyledExternalCard = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  width: 100%;
  padding: 0.5rem;

  :hover,
  :focus,
  :active {
    background-color: ${({ theme }) => theme.primary4};
  }
`

//todo is there a common?
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
  const show = useModalOpen(ApplicationModal.PRIVACY_POLICY)

  useEffect(() => {
    ReactGA.event({
      category: 'Privacy',
      action: 'Show',
    })
  }, [])

  return (
    show && (
      <Wrapper>
        <RowBetween>
          <Trans>Privacy</Trans>
          <X size={12} />
        </RowBetween>
        <PrivacyPolicy />
      </Wrapper>
    )
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
        <OverflowWrapper>
          <AutoColumn gap="12px" style={{ marginBottom: '12px' }}>
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
          </AutoColumn>
        </OverflowWrapper>
      </AutoColumn>
    </Wrapper>
  )
}
