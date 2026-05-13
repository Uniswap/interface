import { Input, InputProps } from '~/components/NumericalInput'
import { css, deprecatedStyled } from '~/lib/deprecated-styled'

export const NumericalInputFontStyle = css<{ $fontSize?: number }>`
  text-align: left;
  font-size: ${({ $fontSize }) => `${$fontSize ?? 70}px`};
  font-weight: 500;
  line-height: 60px;
`

export const NumericalInputWrapper = deprecatedStyled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  max-width: 100%;
  width: max-content;
`

export const StyledNumericalInput = deprecatedStyled(Input)<
  { $width?: number; $hasPrefix?: boolean; $fontSize?: number; $prefixWidth?: number } & InputProps
>`
  max-height: 84px;
  max-width: ${({ $hasPrefix, $prefixWidth }) => ($hasPrefix ? `calc(100% - ${$prefixWidth ?? 43}px)` : '100%')};
  width: ${({ $width }) => `${$width ?? 43}px`}; // this value is from the size of a 0 which is the default value
  font-size: ${({ $fontSize }) => `${$fontSize ?? 70}px`};
  ${NumericalInputFontStyle}

  ::placeholder {
    opacity: 1;
  }
`

export const NumericalInputMimic = deprecatedStyled.span<{ $fontSize?: number }>`
  position: absolute;
  visibility: hidden;
  bottom: 0px;
  right: 0px;
  font-size: ${({ $fontSize }) => `${$fontSize ?? 70}px`};
  ${NumericalInputFontStyle}
`

export const NumericalInputSymbolContainer = deprecatedStyled.span<{ showPlaceholder: boolean; $fontSize?: number }>`
  user-select: none;
  color: ${({ theme }) => theme.neutral1};
  ${NumericalInputFontStyle}
  ${({ showPlaceholder }) =>
    showPlaceholder &&
    css`
      color: ${({ theme }) => theme.neutral3};
    `}
`
