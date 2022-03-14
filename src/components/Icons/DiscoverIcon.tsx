import { ReactComponent as DiscoverIconSvg } from 'assets/svg/discover_icon.svg'
import styled from 'styled-components'

const DiscoverIcon = styled(DiscoverIconSvg)<{ size?: number; color?: string }>`
  min-width: ${({ size }) => (size ?? 14) + 'px'};
  width: ${({ size }) => (size ?? 14) + 'px'};
  color: ${({ color }) => color && color};

  * {
    color: ${({ color }) => color && color};
    fill: ${({ color }) => color && color};
  }
`

export default DiscoverIcon
