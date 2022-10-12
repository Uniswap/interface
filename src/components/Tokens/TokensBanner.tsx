import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { chainIdToBackendName } from 'graphql/data/util'
import { X } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useShowTokensPromoBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'

import tokensPromoDark from '../../assets/images/tokensPromoDark.png'
import tokensPromoLight from '../../assets/images/tokensPromoLight.png'

const BackgroundColor = styled.div`
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : '#FDF0F8')};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  bottom: 48px;
  box-shadow: ${({ theme }) => theme.deepShadow};
  height: 88px;
  position: fixed;
  right: 16px;
  width: 320px;
  z-index: ${Z_INDEX.sticky};
`
const PopupContainer = styled.div<{ show: boolean }>`
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : opacify(60, '#FDF0F8'))};
  background-image: url(${({ theme }) => (theme.darkMode ? `${tokensPromoDark}` : `${tokensPromoLight}`)});
  background-size: cover;
  background-blend-mode: overlay;
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  display: ${({ show }) => (show ? 'flex' : 'none')};
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
const HeaderText = styled(Link)`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  text-decoration: none;
`
const Description = styled(Link)`
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  text-decoration: none;b
  width: 75%;
`

export default function TokensBanner() {
  const theme = useTheme()
  const [showTokensPromoBanner, setShowTokensPromoBanner] = useShowTokensPromoBanner()
  const navigate = useNavigate()
  const { chainId: connectedChainId } = useWeb3React()
  const chainName = chainIdToBackendName(connectedChainId).toLowerCase()

  const navigateToExplorePage = () => {
    navigate(`/tokens/${chainName}`)
  }

  return (
    <BackgroundColor>
      <PopupContainer show={showTokensPromoBanner} onClick={navigateToExplorePage}>
        <Header>
          <HeaderText to={'/tokens'}>
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

        <Description to={'/tokens'}>
          <Trans>Sort and filter assets across networks on the new Tokens page.</Trans>
        </Description>
      </PopupContainer>
    </BackgroundColor>
  )
}
