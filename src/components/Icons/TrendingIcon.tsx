import { ReactComponent as TrendingIconSvg } from 'assets/svg/trending_icon.svg'
import styled from 'styled-components'

const TrendingIcon = styled(TrendingIconSvg)<{ size?: number; color?: string }>`
  min-width: ${({ size }) => (size ?? 14) + 'px'};
  width: ${({ size }) => (size ?? 14) + 'px'};
  color: ${({ color }) => color && color};

  * {
    color: ${({ color }) => color && color};
    fill: ${({ color }) => color && color};
  }
`

export default TrendingIcon
