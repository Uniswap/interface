import Tooltip from 'components/Tooltip'
import React, { useState } from 'react'
import styled from 'styled-components/macro'

const TextWrapper = styled.span<{ margin: boolean; link?: boolean; fontSize?: string; adjustSize?: boolean }>`
  margin-left: ${({ margin }) => margin && '4px'};
  color: ${({ theme, link }) => (link ? theme.blue1 : theme.text1)};
  font-size: ${({ fontSize }) => fontSize ?? 'inherit'};

  @media screen and (max-width: 600px) {
    font-size: ${({ adjustSize }) => adjustSize && '12px'};
  }
`

const HoverInlineText = ({
  text,
  maxCharacters = 20,
  margin = false,
  adjustSize = false,
  fontSize,
  link,
  ...rest
}: {
  text?: string
  maxCharacters?: number
  margin?: boolean
  adjustSize?: boolean
  fontSize?: string
  link?: boolean
}) => {
  const [showHover, setShowHover] = useState(false)

  if (!text) {
    return <span />
  }

  if (text.length > maxCharacters) {
    return (
      <Tooltip text={text} show={showHover}>
        <TextWrapper
          onMouseEnter={() => setShowHover(true)}
          onMouseLeave={() => setShowHover(false)}
          margin={margin}
          adjustSize={adjustSize}
          link={link}
          fontSize={fontSize}
          {...rest}
        >
          {' ' + text.slice(0, maxCharacters - 1) + '...'}
        </TextWrapper>
      </Tooltip>
    )
  }

  return (
    <TextWrapper margin={margin} adjustSize={adjustSize} link={link} fontSize={fontSize} {...rest}>
      {text}
    </TextWrapper>
  )
}

export default HoverInlineText
