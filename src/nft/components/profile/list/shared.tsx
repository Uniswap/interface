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

export enum SetPriceMethod {
  SAME_PRICE,
  FLOOR_PRICE,
  LAST_PRICE,
  CUSTOM,
}

export enum WarningType {
  BELOW_FLOOR,
  ALREADY_LISTED,
  NONE,
}
