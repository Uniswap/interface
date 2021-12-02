import { css } from './styled'

export const scrollable = css`
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
    border-left: 0.75em solid transparent;
  }

  @supports not selector(::-webkit-scrollbar-thumb) {
    overflow-y: scroll;
    scrollbar-color: ${({ theme }) => theme.interactive} transparent;
  }
`
