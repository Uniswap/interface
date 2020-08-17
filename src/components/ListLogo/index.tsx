import React from 'react'
import styled from 'styled-components'
import useHttpLocations from '../../hooks/useHttpLocations'

import Logo from '../Logo'

const StyledListLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function ListLogo({
  logoURI,
  style,
  size = '24px'
}: {
  logoURI: string
  size?: string
  style?: React.CSSProperties
}) {
  const srcs: string[] = useHttpLocations(logoURI)

  return <StyledListLogo size={size} srcs={srcs} alt={`list logo`} style={style} />
}
