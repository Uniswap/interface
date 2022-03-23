import React from 'react'
import { ReactComponent as CarrotLogo } from '../../../assets/svg/carrot.svg'
import styled from 'styled-components'

import { MouseoverTooltip } from '../../Tooltip'

const KpiBadge = styled.div<{ isGreyed: boolean }>`
  height: 16px;
  border: solid 1px;
  border-color: ${props => (props.isGreyed ? `transparent` : `${props.theme.orange1}`)};
  color: ${props => (props.isGreyed ? props.theme.purple2 : props.theme.orange1)};
  svg {
    > path {
      fill: ${props => (props.isGreyed ? props.theme.purple2 : props.theme.orange1)};
    }
  }
  background-color: ${props => props.isGreyed && props.theme.bg3};
  opacity: ${props => props.isGreyed && '0.5'};
  gap: 4px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  line-height: 9px;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  padding: 0 2px;
`
const StyledCarrotLogo = styled(CarrotLogo)`
  width: 16px;
  height: 6px;
  > path {
    fill: #f2994a;
  }
`

const CarrotBadge = ({ isGreyed = false }: { isGreyed?: boolean }) => {
  return (
    <MouseoverTooltip content="Rewards at least a Carrot KPI token">
      <KpiBadge isGreyed={isGreyed}>
        <StyledCarrotLogo />
        CARROT
      </KpiBadge>
    </MouseoverTooltip>
  )
}

export default CarrotBadge
