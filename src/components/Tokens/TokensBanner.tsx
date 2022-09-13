import { X } from 'react-feather'
import { Link } from 'react-router-dom'
import { useShowTokensPromoBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { opacify } from 'theme/utils'

import tokensPromoDark from '../../assets/images/tokensPromoDark.png'
import tokensPromoLight from '../../assets/images/tokensPromoLight.png'

const PopupContainer = styled.div<{ show: boolean }>`
  position: absolute;
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  padding: 12px 16px 12px 20px;
  gap: 8px;
  bottom: 48px;
  right: 16px;
  width: 320px;
  height: 88px;
  z-index: 5;
  background-color: ${({ theme }) => (theme.darkMode ? theme.backgroundScrim : opacify(60, '#FDF0F8'))};
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.deepShadow};

  background-image: url(${({ theme }) => (theme.darkMode ? `${tokensPromoDark}` : `${tokensPromoLight}`)});
  background-size: cover;
  background-blend-mode: overlay;

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
`
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const HeaderText = styled(Link)`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`
const Description = styled(Link)`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  width: 75%;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`

export default function TokensBanner() {
  const theme = useTheme()
  const [showTokensPromoBanner, setShowTokensPromoBanner] = useShowTokensPromoBanner()

  const closeBanner = () => {
    setShowTokensPromoBanner(false)
  }

  return (
    <PopupContainer show={showTokensPromoBanner}>
      <Header>
        <HeaderText to={'/tokens'} onClick={closeBanner}>
          Explore Top Tokens
        </HeaderText>
        <X size={20} color={theme.textSecondary} onClick={closeBanner} style={{ cursor: 'pointer' }} />
      </Header>

      <Description to={'/tokens'} onClick={closeBanner}>
        Check out the new explore tab to discover and learn more
      </Description>
    </PopupContainer>
  )
}
