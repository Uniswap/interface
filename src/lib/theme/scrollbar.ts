import { RefObject } from 'react'

import { css } from './styled'

/**
 * Customizes the scrollbar for vertical overflow.
 * The element should already have overflow-y set.
 * The scrollable element ref must be passed to determine if overflow will occur,
 * so that the gutter can be sized accordingly.
 */
export const scrollbarCss = (ref: RefObject<HTMLElement | null>) => {
  console.log(
    ref.current,
    ref.current?.scrollHeight,
    ref.current?.clientHeight,
    ref.current && ref.current.scrollHeight > ref.current.clientHeight
  )
  const hasOverflow = ref.current && ref.current.scrollHeight > ref.current.clientHeight
  return hasOverflow
    ? css`
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
          border-right: 0.75em solid transparent;
        }

        @supports not selector(::-webkit-scrollbar-thumb) {
          overflow-y: scroll;
          scrollbar-color: ${({ theme }) => theme.interactive} transparent;
        }

        @supports selector(::-webkit-scrollbar-thumb) {
          ::-webkit-scrollbar-thumb {
          }
        }
      `
    : undefined
}
