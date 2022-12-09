import { ReactNode } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const Wrapper = styled.div<{ height: string; width: string; background?: string }>`
  border-radius: 999px;
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  background: ${({ background }) => background || 'rgba(182, 182, 182, 0.2)'};
  position: relative;
`
const Bar = styled.div<{ percent: number; color?: string }>`
  border-radius: 999px;
  height: 100%;
  background: ${({ theme, color }) => color || theme.primary};
  width: ${({ percent }) => percent}%;
  position: absolute;
  left: 0;
  top: 0;
`

export default function ProgressBar({
  percent,
  color,
  valueColor,
  label,
  value,
  height = '6px',
  labelColor,
  backgroundColor,
  width,
}: {
  label?: string
  value?: ReactNode
  percent: number
  color?: string // bar color
  backgroundColor?: string // deactive bar color
  valueColor?: string
  labelColor?: string
  height?: string
  width?: string
}) {
  const theme = useTheme()
  return (
    <Flex flexDirection={'column'} style={{ gap: 5 }}>
      {label && value ? (
        <Flex justifyContent={'space-between'} fontSize={12} color={labelColor || theme.subText} lineHeight={'normal'}>
          {label} <Text color={valueColor || theme.subText}>{value}</Text>
        </Flex>
      ) : null}
      <Wrapper height={height} width={width ?? 'unset'} background={backgroundColor}>
        <Bar percent={Math.min(100, percent)} color={color} />
      </Wrapper>
    </Flex>
  )
}
