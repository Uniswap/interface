import { PropsWithChildren, useState } from 'react'
import { Info } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { ReactComponent as TooltipTriangle } from '../../../assets/svg/tooltip_triangle.svg'

const InfoTipContainer = styled.div`
  display: flex;
  position: relative;
  align-items: center;
  cursor: pointer;
`

const InfoTipWrapper = styled.div<{ breakpoint: string }>`
  display: flex;
  flex-direction: row;
  position: absolute;
  left: 15px;
  max-width: 280;
  ${({ breakpoint }) => css`
    @media only screen and (max-width: ${breakpoint}) {
      flex-direction: column;
      top: 20px;
      transform: translateX(calc(-50% - 8px));
    }
  `}
`

const InfoTipBody = styled.div<{ breakpoint: string }>`
  z-index: ${Z_INDEX.popover};
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  padding: 10px 12px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  width: 228px;
  box-shadow: ${({ theme }) => theme.deepShadow};

  ${({ breakpoint }) => css`
    @media only screen and (max-width: ${breakpoint}) {
      width: 186px;
    }
  `}
`

const TriangleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledTooltipTriangle = styled(TooltipTriangle)<{ breakpoint: string }>`
  z-index: ${Z_INDEX.tooltip};
  path {
    fill: ${({ theme }) => theme.backgroundBackdrop};
  }
  rotate: -90deg;
  transform: translateY(2.5px);
  ${({ breakpoint }) => css`
    @media only screen and (max-width: ${breakpoint}) {
      rotate: none;
      transform: translateY(0);
    }
  `}
`

export default function InfoTip({ children, breakpoint }: PropsWithChildren<{ breakpoint: string }>) {
  const [isHover, setIsHover] = useState(false)
  return (
    <InfoTipContainer onMouseOver={() => setIsHover(true)} onMouseOut={() => setIsHover(false)}>
      <Info size={14} />
      {isHover && (
        <InfoTipWrapper breakpoint={breakpoint}>
          <TriangleWrapper>
            <StyledTooltipTriangle breakpoint={breakpoint} />
          </TriangleWrapper>

          <InfoTipBody breakpoint={breakpoint}>{children}</InfoTipBody>
        </InfoTipWrapper>
      )}
    </InfoTipContainer>
  )
}
