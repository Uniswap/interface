import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'analytics/constants'
import { TraceEvent } from 'analytics/TraceEvent'
import { chainIdToBackendName } from 'graphql/data/util'
import { X } from 'react-feather'
import { Link } from 'react-router-dom'
import { useShowTokensPromoBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'

import tokensPromoDark from '../../assets/images/tokensPromoDark.png'
import tokensPromoLight from '../../assets/images/tokensPromoLight.png'

const BackgroundColor = styled(Link)<{ show: boolean }>`
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : '#FDF0F8')};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  bottom: 48px;
  box-shadow: ${({ theme }) => theme.deepShadow};
  display: ${({ show }) => (show ? 'block' : 'none')};
  height: 88px;
  position: fixed;
  right: clamp(0px, 1vw, 16px);
  text-decoration: none;
  width: 320px;
  z-index: ${Z_INDEX.sticky};
`
const PopupContainer = styled.div`
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : opacify(60, '#FDF0F8'))};
  background-image: url(${({ theme }) => (theme.darkMode ? `${tokensPromoDark}` : `${tokensPromoLight}`)});
  background-size: cover;
  background-blend-mode: overlay;
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  padding: 12px 16px 12px 20px;

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
`
const Header = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`
const HeaderText = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
`

const Description = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  width: max(212px, calc(100% - 36px));
`

export default function TokensBanner() {
  const theme = useTheme()
  const [showTokensPromoBanner, setShowTokensPromoBanner] = useShowTokensPromoBanner()
  const { chainId: connectedChainId } = useWeb3React()
  const chainName = chainIdToBackendName(connectedChainId).toLowerCase()

  return (
    <BackgroundColor show={showTokensPromoBanner} to={`/tokens/${chainName}`}>
      <TraceEvent events={[Event.onClick]} name={EventName.EXPLORE_BANNER_CLICKED} element={ElementName.EXPLORE_BANNER}>
        <PopupContainer>
          <Header>
            <HeaderText>
              <Trans>Explore Top Tokens on Uniswap</Trans>
            </HeaderText>
            <X
              size={20}
              color={theme.textSecondary}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowTokensPromoBanner(false)
              }}
              style={{ cursor: 'pointer' }}
            />
          </Header>

          <Description>
            <Trans>Sort and filter assets across networks on the new Tokens page.</Trans>
          </Description>
        </PopupContainer>
      </TraceEvent>
    </BackgroundColor>
  )
}
