import { PropsWithChildren } from 'react'
import { Icon } from 'react-feather'
import styled from 'styled-components/macro'

import { themeVars } from '../../nft/css/sprinkles.css'

export const IconHoverText = styled.span`
  color: ${({ theme }) => theme.deprecated_text1};
  position: absolute;
  top: 28px;
  border-radius: 8px;
  transform: translateX(-50%);
  opacity: 0;
  font-size: 12px;
  padding: 5px;
  left: 10px;
`

interface BadgeProps {
  onClick: () => void
}

const IconBlock = styled.div<PropsWithChildren<BadgeProps>>`
  background-color: ${themeVars.colors.lightGrayButton};
  border-radius: 12px;
  display: inline-block;
  position: relative;
  height: 32px;
  width: 32px;
  color: ${themeVars.colors.blackBlue};
  :hover {
    background-color: rgba(173, 188, 255, 0.48);
    -webkit-transition: background-color 200ms linear;
    cursor: pointer;
    ${IconHoverText} {
      opacity: 1;
    }
  }
  :active {
    background-color: ${themeVars.colors.white95};
    -webkit-transition: background-color 50ms linear;
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
  text: JSX.Element
  Icon: Icon
  onClick: () => void
}

const IconButton = ({ Icon, onClick, text }: IconButtonProps) => (
  <IconBlock onClick={onClick}>
    <IconWrapper>
      <Icon strokeWidth={1.5} size={16} />
      <IconHoverText>{text}</IconHoverText>
    </IconWrapper>
  </IconBlock>
)

export default IconButton
