import { Icon } from 'react-feather'
import styled from 'styled-components/macro'

export const IconHoverText = styled.span`
  color: ${({ theme }) => theme.textPrimary};
  position: absolute;
  top: 28px;
  border-radius: 8px;
  transform: translateX(-50%);
  opacity: 0;
  font-size: 12px;
  padding: 5px;
  left: 10px;
`

const IconBlock = styled.a`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  display: inline-block;
  cursor: pointer;
  position: relative;
  height: 32px;
  width: 32px;
  color: ${({ theme }) => theme.textPrimary};
  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    transition: background-color 200ms linear;

    ${IconHoverText} {
      opacity: 1;
    }
  }
  :active {
    background-color: ${({ theme }) => theme.backgroundSurface};
    transition: background-color 50ms linear;
  }
`

const IconWrapper = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
`

interface IconButtonProps {
  text: React.ReactNode
  Icon: Icon
  onClick?: () => void
  href?: string
}

const IconButton = ({ Icon, onClick, text, href }: IconButtonProps) => (
  <IconBlock onClick={onClick} href={href} target="_blank">
    <IconWrapper>
      <Icon strokeWidth={1.5} size={16} />
      <IconHoverText>{text}</IconHoverText>
    </IconWrapper>
  </IconBlock>
)

export default IconButton
