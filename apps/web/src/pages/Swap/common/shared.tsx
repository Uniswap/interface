import Row from 'components/deprecated/Row'
import { Input, InputProps } from 'components/NumericalInput'
import { css, deprecatedStyled } from 'lib/styled-components'
import { useLayoutEffect, useState } from 'react'

export const NumericalInputFontStyle = css<{ $fontSize?: number }>`
  text-align: left;
  font-size: ${({ $fontSize }) => `${$fontSize ?? 70}px`};
  font-weight: 500;
  line-height: 60px;
`

export const NumericalInputWrapper = deprecatedStyled(Row)`
  position: relative;
  max-width: 100%;
  width: max-content;
`

export const StyledNumericalInput = deprecatedStyled(Input)<
  { $width?: number; $hasPrefix?: boolean; $fontSize?: number } & InputProps
>`
  max-height: 84px;
  max-width: ${({ $hasPrefix }) => ($hasPrefix ? 'calc(100% - 43px)' : '100%')};
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

export function useWidthAdjustedDisplayValue(displayValue: string) {
  const [postWidthAdjustedDisplayValue, setPostWidthAdjustedDisplayValue] = useState('')

  // Doing this to set the value the user is seeing once the width of the
  // hidden element is known (after 1 render) so users don't see a weird jump
  useLayoutEffect(() => {
    requestAnimationFrame(() => setPostWidthAdjustedDisplayValue(displayValue))
  }, [displayValue])

  return postWidthAdjustedDisplayValue
}
