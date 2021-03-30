import React from 'react'
import styled, { css } from 'styled-components'
import { CardProps, Text } from 'rebass'
import { Box } from 'rebass/styled-components'

const Card = styled(Box)<{ padding?: string; border?: string; borderRadius?: string }>`
  width: 100%;
  border-radius: 16px;
  padding: 1.25rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius ?? '8px'};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg3};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.text5};
`

export const PinkCard = styled(Card)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.primary1};
  font-weight: 500;
`

export const DarkCard = styled(Card)<{ selectable?: boolean }>`
  background-image: linear-gradient(180deg, rgba(41, 38, 67, 0) 0%, rgba(68, 65, 99, 0.5) 100%);
  position: relative;
  cursor: ${props => (props.selectable ? 'pointer' : 'auto')};
  z-index: 0;
  ::before {
    background: linear-gradient(153.77deg, rgba(55, 82, 233, 0.35) -144.38%, rgba(55, 82, 233, 0) 65.22%), #171621;
    content: '';
    z-index: -1;
    top: 1px;
    left: 1px;
    bottom: 1px;
    right: 1px;
    position: absolute;
    border-radius: 8px;
  }
  ${props =>
    props.selectable &&
    css`
      :hover::after {
        opacity: 1;
      }
      ::after {
        content: '';
        position: absolute;
        z-index: -1;
        border-radius: 8px;
        top: 1px;
        bottom: 1px;
        left: 1px;
        right: 1px;
        background: linear-gradient(110.34deg, #ffffff 0.16%, rgba(0, 0, 0, 0) 139.17%), ${({ theme }) => theme.dark1};
        background-blend-mode: overlay, normal;
        transition: 0.3s ease opacity;
        opacity: 0;
      }
    `}
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  color: ${({ theme }) => theme.primary1};
  border-radius: 12px;
  width: fit-content;
`

export const BlueCard = ({ children, ...rest }: CardProps) => {
  return (
    <BlueCardStyled {...rest}>
      <Text fontWeight={500} color="#2172E5">
        {children}
      </Text>
    </BlueCardStyled>
  )
}
