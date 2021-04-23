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
  position: relative;
  ::before {
    background-color: ${props => props.theme.darkest};
    content: '';
    z-index: -1;
    top: 1px;
    left: 1px;
    bottom: 1px;
    right: 1px;
    position: absolute;
    border-radius: 8px;
  }
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

export const GradientCard = styled(Card)<{ selectable?: boolean; active?: boolean }>`
  background: linear-gradient(113.18deg, rgba(255, 255, 255, 0.35) -0.1%, rgba(0, 0, 0, 0) 98.9%),
    ${({ theme }) => theme.dark1};
  background-color: ${({ theme }) => theme.dark1};
  background-blend-mode: overlay, normal;
  padding: 0.8rem;
  padding: 24px 30px;
  display: flex;
  flex-wrap: wrap;
  cursor: ${props => (props.selectable ? 'pointer' : 'auto')};
  opacity: 1;
  border: solid 1px ${props => props.theme.bg3};
  position: relative;
  ${props =>
    props.selectable &&
    css`
      > * {
        z-index: 1;
      }

      :hover::before {
        opacity: 1;
      }

      ::before {
        content: '';
        position: absolute;
        z-index: 0;
        border-radius: 8px;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(110.34deg, #ffffff 0.16%, rgba(0, 0, 0, 0) 139.17%), ${({ theme }) => theme.dark1};
        background-blend-mode: overlay, normal;
        transition: 0.3s ease opacity;
        opacity: 0;
      }
    `}
`
