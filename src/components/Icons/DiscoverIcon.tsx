import styled from 'styled-components'

import { ReactComponent as DiscoverIconSvg } from 'assets/svg/discover_icon.svg'

const DiscoverIcon = styled(DiscoverIconSvg)<{ size?: number; color?: string }>`
  min-width: ${({ size }) => (size ?? 12) + 'px'};
  width: ${({ size }) => (size ?? 12) + 'px'};
  height: ${({ size }) => (size ?? 12) + 'px'};
  color: ${({ color }) => color && color};

  * {
    color: ${({ color }) => (color ? color : 'currentColor')};
    fill: ${({ color }) => (color ? color : 'currentColor')};
  }
`

export default DiscoverIcon
