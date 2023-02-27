import Row from 'components/Row'
import styled from 'styled-components/macro'

export const RemoveIconWrap = styled.div<{ hovered: boolean }>`
  position: absolute;
  left: 50%;
  top: 30px;
  transform: translateX(-50%);
  width: 32px;
  visibility: ${({ hovered }) => (hovered ? 'visible' : 'hidden')};
`

export const TitleRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
`
