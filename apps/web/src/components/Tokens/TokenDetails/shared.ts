import deprecatedStyled from 'lib/styled-components'
import { TamaguiClickableStyle } from 'theme/components/styles'
import { TextProps } from 'ui/src'

export const ActionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  py: '$spacing8',
  px: '$spacing12',
  borderRadius: 20,
  borderWidth: 0,
  width: 'maxContent',
  ...TamaguiClickableStyle,

  hoverStyle: {
    backgroundColor: '$surface2Hovered',
  },
  focusStyle: {
    backgroundColor: '$surface1Hovered',
  },
} satisfies TextProps

export const Hr = deprecatedStyled.hr`
  background-color: ${({ theme }) => theme.surface3};
  border: none;
  height: 0.5px;
`

export const NoInfoAvailable = deprecatedStyled.p`
  color: ${({ theme }) => theme.neutral3};
  font-weight: 485;
  font-size: 16px;
`

export const truncateDescription = (desc: string, maxCharacterCount = TRUNCATE_CHARACTER_COUNT) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, maxCharacterCount)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' ')),
  )}...`
  return tokenDescriptionTruncated
}

const TRUNCATE_CHARACTER_COUNT = 400
