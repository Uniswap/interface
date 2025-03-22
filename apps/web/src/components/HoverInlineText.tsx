import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'

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
  if (!text) {
    return <span />
  }

  if (text.length > maxCharacters) {
    return (
      <MouseoverTooltip text={text}>
        <TextWrapper
          margin={margin}
          adjustSize={adjustSize}
          textColor={textColor}
          link={link}
          fontSize={fontSize}
          {...rest}
        >
          {' ' + text.slice(0, maxCharacters - 1) + '...'}
        </TextWrapper>
      </MouseoverTooltip>
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
