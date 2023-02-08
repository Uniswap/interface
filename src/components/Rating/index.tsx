import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import useTheme from 'hooks/useTheme'

export const Circle = styled.div<{ size?: number; color: string }>`
  width: ${({ size }) => size || 12}px;
  height: ${({ size }) => size || 12}px;
  min-width: ${({ size }) => size || 12}px;
  min-height: ${({ size }) => size || 12}px;
  max-width: ${({ size }) => size || 12}px;
  max-height: ${({ size }) => size || 12}px;

  border-radius: 999px;
  ${({ color }) =>
    color &&
    css`
      background-color: ${color};
    `};
`
export default function Rating({ point, color }: { point: number; color: string }) {
  const theme = useTheme()
  const greyCount = 5 - point
  return (
    <Flex sx={{ gap: '4px' }} flexDirection="row">
      {new Array(point).fill(0).map((_, index) => (
        <Circle color={color || theme.primary} key={index + (color || theme.primary)} size={12} />
      ))}
      {new Array(greyCount).fill(0).map((_, index) => (
        <Circle color={theme.tableHeader} key={index + theme.tableHeader} size={12} />
      ))}
    </Flex>
  )
}
