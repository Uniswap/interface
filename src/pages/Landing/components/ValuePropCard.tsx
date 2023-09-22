import styled from 'styled-components'

import { Box } from './Generics'

type ValuePropCardProps = {
  isDarkMode?: boolean
  backgroundColor?: { light: string; dark: string }
  textColor?: string
  height?: string
  tagText?: string
  titleText?: string
  children?: React.ReactNode
}

export default function ValuePropCard(props: ValuePropCardProps) {
  const { isDarkMode, backgroundColor, height, textColor } = props

  return (
    <Container isDarkMode={isDarkMode} backgroundColor={backgroundColor} height={height}>
      <Box direction="column" padding="32px" gap="24px">
        <Pill>
          {/* Icon goes here */}
          <Label color={textColor}>{props.tagText}</Label>
        </Pill>
        <Title color={textColor}>{props.titleText}</Title>
      </Box>
      {props.children}
    </Container>
  )
}

const Container = styled.div<ValuePropCardProps>`
  position: relative;
  border-radius: 24px;
  width: 100%;
  height: ${(props) => props.height || 'auto'};
  background-color: ${(props) => (props.isDarkMode ? props.backgroundColor?.dark : props.backgroundColor?.light)};
  overflow: hidden;
`

// const Imagery = styled.div`
//   position: absolute;
//   width: 100%;
//   height: 100%;
// `

const Title = styled.div`
  color: ${(props) => props.color};
  font-feature-settings: 'ss07' on;
  font-family: Basel;
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 44px; /* 122.222% */
  white-space: pre-line;
`

const Pill = styled.div`
  padding: 12px 16px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.surface1};
`

const Label = styled.div`
  color: ${(props) => props.color};
  /* Button Label/1 */
  font-family: Basel;
  font-size: 20px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px; /* 120% */
  white-space: pre-line;
`
