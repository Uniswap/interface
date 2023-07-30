import styled from 'styled-components'

const MAX_STRENGTH = 5
const BLUR_STEPS = 20
const BLUR_FADE = '#fff'

const NAV_HEIGHT = 72

const BlurGroup = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-image: linear-gradient(${BLUR_FADE}, rgba(${BLUR_FADE}, 0));
`

const BlurLayer = styled.div<{ index: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${({ index }) => (NAV_HEIGHT / BLUR_STEPS) * index}px;
  backdrop-filter: blur(${({ index }) => (MAX_STRENGTH / BLUR_STEPS) * (BLUR_STEPS - index)}px);
`

export default function Blur() {
  return (
    <BlurGroup>
      {Array.from(Array(BLUR_STEPS), (_, index) => (
        <BlurLayer index={index} key={`blur-${index}`} />
      ))}
    </BlurGroup>
  )
}
