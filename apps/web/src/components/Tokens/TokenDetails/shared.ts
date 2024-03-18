import { darken } from 'polished'
import styled, { css } from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { opacify } from 'theme/utils'

export const ActionButtonStyle = css`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
  border-radius: 20px;
  border: none;
  background-color: ${({ theme }) => theme.surface2};
  width: max-content;
  ${ClickableStyle}

  // Override FilterButton background-color
  :hover {
    background-color: ${({ theme }) => opacify(12, theme.neutral1)};
  }
  :focus {
    background-color: ${({ theme }) => opacify(12, theme.neutral1)};
  }
`

export const ActionMenuFlyoutStyle = css`
  width: 200px;
  top: 40px;
  right: 0px;
  overflow: auto;
`

export const Hr = styled.hr`
  background-color: ${({ theme }) => theme.surface3};
  border: none;
  height: 0.5px;
`

export const NoInfoAvailable = styled.p`
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

const TRUNCATE_CHARACTER_COUNT = 400
