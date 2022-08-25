import { X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

const PopupContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  gap: 8px;
  right: 16px;
  bottom: 48px;
  width: 320px;
  height: 88px;
  z-index: 5;
  background-color: ${({ theme }) => theme.backgroundScrim};
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
`
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const HeaderText = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
`
const Description = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  width: 240px;
`

export default function TokensBanner() {
  const theme = useTheme()
  return (
    <PopupContainer>
      <Header>
        <HeaderText>Explore Top Tokens</HeaderText>
        <X size={20} color={theme.textSecondary} />
      </Header>

      <Description>Check out the new explore tab to discover and learn more</Description>
    </PopupContainer>
  )
}
