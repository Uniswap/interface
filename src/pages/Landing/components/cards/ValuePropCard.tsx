import { motion } from 'framer-motion'
import styled from 'styled-components'

import { BoxProps } from '../Generics'
import { Box } from '../Generics'

type ValuePropCardProps = {
  isDarkMode?: boolean
  backgroundColor?: { light: string; dark: string }
  textColor?: string
  height?: string
  minHeight?: string
  tagText?: string
  titleText?: string
  children?: React.ReactNode
  button?: React.ReactNode
  href?: string
}

export default function ValuePropCard(props: ValuePropCardProps & BoxProps) {
  const { isDarkMode, backgroundColor, height, textColor, minHeight } = props

  return (
    <Container
      initial="initial"
      whileHover="hover"
      isDarkMode={isDarkMode}
      backgroundColor={backgroundColor}
      height={height}
      minHeight={minHeight}
      {...props}
    >
      <Box direction="column" padding="32px" gap="24px">
        {props.button}
        <Title color={textColor}>{props.titleText}</Title>
      </Box>
      {props.children}
    </Container>
  )
}

const Container = motion(styled(Box)<ValuePropCardProps & BoxProps>`
  position: relative;
  border-radius: 24px;
  width: 100%;
  cursor: pointer;
  height: ${(props) => props.height || 'auto'};
  background-color: ${(props) => (props.isDarkMode ? props.backgroundColor?.dark : props.backgroundColor?.light)};
  overflow: hidden;
    @media (max-width: 768px) {
    height: auto;
    min-height: ${(props) => props.minHeight || '240px'};
`)

const Title = styled.div`
  color: ${(props) => props.color};
  font-feature-settings: 'ss07' on;
  font-family: Basel;
  font-size: 36px;
  font-style: normal;
  font-weight: 500;
  line-height: 44px; /* 122.222% */
  white-space: pre-line;
  @media (max-width: 768px) {
    font-size: 24px;
    line-height: 32px;
  }
`
