import { useMemo } from 'react'

import { css } from './styled'

const overflowCss = css`
  overflow-y: scroll;
`

/** Customizes the scrollbar for vertical overflow. */
const scrollbarCss = (padded: boolean) => css`
  overflow-y: scroll;

  ::-webkit-scrollbar {
    width: 1.25em;
  }

  ::-webkit-scrollbar-thumb {
    background: radial-gradient(
        closest-corner at 0.25em 0.25em,
        ${({ theme }) => theme.interactive} 0.25em,
        transparent 0.25em
      ),
      linear-gradient(
        to bottom,
        transparent 0.25em,
        ${({ theme }) => theme.interactive} 0.25em,
        ${({ theme }) => theme.interactive} calc(100% - 0.25em),
        transparent calc(100% - 0.25em)
      ),
      radial-gradient(
        closest-corner at 0.25em calc(100% - 0.25em),
        ${({ theme }) => theme.interactive} 0.25em,
        transparent 0.25em
      );
    background-clip: padding-box;
    border: none;
    ${padded ? 'border-right' : 'border-left'}: 0.75em solid transparent;
  }

  @supports not selector(::-webkit-scrollbar-thumb) {
    scrollbar-color: ${({ theme }) => theme.interactive} transparent;
  }
`

interface ScrollbarOptions {
  padded?: boolean
  css?: ReturnType<typeof css>
}

export function useScrollbar(
  element: HTMLElement | null,
  { padded = false, css: additionalCss }: ScrollbarOptions = {}
) {
  return useMemo(() => {
    if (element && element.scrollHeight > element.clientHeight) {
      return css`
        ${scrollbarCss(padded)}
        ${additionalCss}
      `
    }
    return overflowCss
  }, [additionalCss, element, padded])
}
