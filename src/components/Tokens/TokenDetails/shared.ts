import { darken } from 'polished'
import styled from 'styled-components'

export const NoInfoAvailable = styled.span`
  color: ${({ theme }) => theme.neutral3};
  font-weight: 485;
  font-size: 16px;
`

export const TruncateDescriptionButton = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-weight: 485;
  font-size: 0.85em;
  padding-top: 0.5em;

  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.neutral2)};
    cursor: pointer;
  }
`

export const truncateDescription = (desc: string, maxCharacterCount = TRUNCATE_CHARACTER_COUNT) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, maxCharacterCount)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' '))
  )}...`
  return tokenDescriptionTruncated
}

export const TRUNCATE_CHARACTER_COUNT = 400
