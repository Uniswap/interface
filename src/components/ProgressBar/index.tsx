import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  border-radius: 999px;
  height: 6px;
  background: rgba(182, 182, 182, 0.2);
  position: relative;
`
const Bar = styled.div<{ percent: number; color?: string }>`
  border-radius: 999px;
  height: 6px;
  background: ${({ theme, color }) => color || theme.primary};
  width: ${({ percent }) => percent}%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
`

export default function ProgressBar({
  percent,
  color,
  valueTextColor,
  title,
  value,
}: {
  title: string
  value: string
  percent: number
  color?: string
  valueTextColor?: string
}) {
  const theme = useTheme()
  return (
    <Flex flexDirection={'column'} style={{ gap: 5 }}>
      <Flex justifyContent={'space-between'} fontSize={12} color={theme.subText} lineHeight={'normal'}>
        {title} <Text color={valueTextColor || theme.subText}>{value}</Text>
      </Flex>
      <Wrapper>
        <Bar percent={Math.min(100, percent)} color={color} />
      </Wrapper>
    </Flex>
  )
}
