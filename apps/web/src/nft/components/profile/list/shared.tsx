import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'

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
  SAME_PRICE = 0,
  FLOOR_PRICE = 1,
  LAST_PRICE = 2,
  CUSTOM = 3,
}

export enum WarningType {
  BELOW_FLOOR = 0,
  ALREADY_LISTED = 1,
  NONE = 2,
}
