import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import Column from 'components/Column'
import LightBulb from 'components/Icons/LightBulb'
import StakeIcon from 'components/Icons/Stake'
import VoteIcon from 'components/Icons/Vote'
import { APP_PATHS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import { DropdownTextAnchor, StyledNavExternalLink, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const KyberDaoWrapper = styled.span`
  display: inline-flex;
  @media (max-width: 1040px) {
    display: none;
  }
`

const KyberDAONavGroup = () => {
  const { pathname } = useLocation()
  const isActive = pathname.includes(APP_PATHS.KYBERDAO_STAKE)
  const { mixpanelHandler } = useMixpanel()

  return (
    <KyberDaoWrapper>
      <NavGroup
        isActive={isActive}
        anchor={
          <DropdownTextAnchor>
            <Trans>KyberDAO</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Column>
            <StyledNavLink id={`kyberdao-stake-knc`} to={APP_PATHS.KYBERDAO_STAKE} style={{ gap: '4px' }}>
              <StakeIcon />
              <Trans>Stake KNC</Trans>
            </StyledNavLink>
            <StyledNavLink id={`kyberdao-vote`} to={APP_PATHS.KYBERDAO_VOTE} style={{ gap: '4px' }}>
              <VoteIcon />
              <Trans>Vote</Trans>
            </StyledNavLink>
            <StyledNavExternalLink
              id={`kyberdao-feature-request`}
              href={'https://kyberswap.canny.io/feature-request'}
              target="_blank"
              style={{ gap: '4px' }}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.KYBER_DAO_FEATURE_REQUEST_CLICK)
              }}
            >
              <LightBulb />
              <Trans>Feature Request</Trans>
            </StyledNavExternalLink>
          </Column>
        }
      />
    </KyberDaoWrapper>
  )
}

export default KyberDAONavGroup
