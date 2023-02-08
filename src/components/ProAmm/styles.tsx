import styled from 'styled-components'

import { Swap2 as SwapIcon } from 'components/Icons'

const ArrowWrapper = styled.div<{ rotated?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: fit-content;
  cursor: pointer;

  transform: rotate(${({ rotated }) => (rotated ? '180deg' : '0')});
  transition: transform 300ms;
  :hover {
    opacity: 0.8;
  }
`
export const RotateSwapIcon = ({ rotated, size = 14 }: { rotated: boolean; size: number }) => (
  <ArrowWrapper rotated={rotated}>
    <SwapIcon size={size} />
  </ArrowWrapper>
)
