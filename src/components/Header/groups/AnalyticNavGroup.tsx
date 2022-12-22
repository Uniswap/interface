import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { AGGREGATOR_ANALYTICS_URL, PROMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import { DropdownTextAnchor, StyledNavExternalLink } from '../styleds'
import NavGroup from './NavGroup'

const AnalyticsWrapper = styled.span`
  display: flex;
  align-items: center;
  @media (max-width: 1320px) {
    display: none;
  }
`

const AnalyticNavGroup = () => {
  const { chainId } = useActiveWeb3React()

  const { mixpanelHandler } = useMixpanel()

  return (
    <AnalyticsWrapper>
      <NavGroup
        isActive={false}
        forceOpen={false}
        anchor={
          <DropdownTextAnchor>
            <Trans>Analytics</Trans>
          </DropdownTextAnchor>
        }
        dropdownContent={
          <Flex
            sx={{
              flexDirection: 'column',
            }}
          >
            <StyledNavExternalLink
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.ANALYTICS_MENU_CLICKED)
              }}
              target="_blank"
              href={PROMM_ANALYTICS_URL[chainId] + '/home'}
            >
              <Trans>Liquidity</Trans>
            </StyledNavExternalLink>

            <StyledNavExternalLink target="_blank" href={AGGREGATOR_ANALYTICS_URL}>
              <Trans>Aggregator</Trans>
            </StyledNavExternalLink>
          </Flex>
        }
      />
    </AnalyticsWrapper>
  )
}

export default AnalyticNavGroup
