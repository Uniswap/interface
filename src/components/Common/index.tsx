import { css } from 'styled-components/macro'

export const ScrollBarStyles = css<{ $isHorizontalScroll?: boolean }>`
  // Firefox scrollbar styling
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.backgroundOutline} transparent`};
  height: 100%;

  // safari and chrome scrollbar styling
  ::-webkit-scrollbar {
    background: transparent;

    // Set height for horizontal scrolls
    ${({ $isHorizontalScroll }) => {
      return $isHorizontalScroll
        ? css`
            height: 4px;
            overflow-x: scroll;
          `
        : css`
            width: 4px;
            overflow-y: scroll;
          `
    }}
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundOutline};
    border-radius: 8px;
  }
`

export const OpacityHoverState = css`
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `opacity ${duration.medium} ${timing.ease}`};
`
