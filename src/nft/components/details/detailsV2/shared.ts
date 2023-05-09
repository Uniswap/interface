import styled, { css } from 'styled-components/macro'
import { opacify } from 'theme/utils'

export const containerStyles = css`
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  padding: 16px 20px;
  width: 100%;
  align-self: flex-start;
`

export const TableContentContainer = styled.div`
  height: 568px;
`

// Scrim that fades out the top and bottom of the scrollable container, isBottom changes the direction and placement of the fade
export const Scrim = styled.div<{ isBottom?: boolean }>`
  position: absolute;
  pointer-events: none;
  height: 88px;
  left: 0px;
  right: 6px;

  ${({ isBottom }) =>
    isBottom
      ? 'bottom: 0px'
      : `
        top: 0px;
        transform: matrix(1, 0, 0, -1, 0, 0);
      `};

  background: ${({ theme }) =>
    `linear-gradient(180deg, ${opacify(0, theme.backgroundSurface)} 0%, ${theme.backgroundSurface} 100%)`};
  display: flex;
`
