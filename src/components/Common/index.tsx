import { css } from 'styled-components/macro'

export const ScrollBarStyles = css<{ isHorizontalScroll?: boolean }>`
  // Firefox scrollbar styling
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.backgroundOutline} transparent`};
  overflow-y: scroll;
  height: 100%;

  // safari and chrome scrollbar styling
  ::-webkit-scrollbar {
    background: transparent;

    ${({ isHorizontalScroll }) => {
      return isHorizontalScroll ? 'height: 4px;' : 'width: 4px;'
    }}
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundOutline};
    border-radius: 8px;
  }
`
