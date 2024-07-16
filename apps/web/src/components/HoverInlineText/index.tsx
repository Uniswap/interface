import Tooltip from 'components/Tooltip'
import { useState } from 'react'
import styled from 'styled-components'

const TextWrapper = styled.span<{
  margin: boolean
  link?: boolean
  fontSize?: string
  adjustSize?: boolean
  textColor?: string
}>`
  margin-left: ${({ margin }) => margin && '4px'};
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
  textColor,
  link,
  ...rest
}: {
  text?: string
  maxCharacters?: number
  margin?: boolean
  adjustSize?: boolean
  fontSize?: string
  textColor?: string
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
          textColor={textColor}
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
    <TextWrapper
      margin={margin}
      adjustSize={adjustSize}
      link={link}
      fontSize={fontSize}
      textColor={textColor}
      {...rest}
    >
      {text}
    </TextWrapper>
  )
}

export default HoverInlineText
