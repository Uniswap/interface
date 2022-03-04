import styled, { keyframes } from 'lib/theme'

const rotate = keyframes`
from {
  transform: rotate(0deg);
}
to {
  transform: rotate(360deg);
}
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  height: 16px;
  transition: 250ms ease color;
  width: 16px;
`

const InnerDot = styled.div`
  background-color: ${({ theme }) => theme.outline};
  border-radius: 50%;
  height: 8px;
  margin-left: 3px;
  min-height: 8px;
  min-width: 8px;
  position: relative;
  transition: 250ms ease background-color;
  width: 8px;
`

const OuterRing = styled.div`
  animation: ${rotate} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  background: transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.primary};
  border-radius: 50%;
  border-right: 1px solid transparent;
  border-top: 1px solid transparent;
  height: 14px;
  left: -3px;
  position: relative;
  top: -3px;
  transform: translateZ(0);
  transition: 250ms ease border-color;
  width: 14px;
`

export default function InlineSpinner() {
  return (
    <Wrapper>
      <InnerDot>
        <OuterRing />
      </InnerDot>
    </Wrapper>
  )
}
