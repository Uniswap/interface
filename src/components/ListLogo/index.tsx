import React from 'react'
import styled from 'styled-components/macro'
import useHttpLocations from '../../hooks/useHttpLocations'

import Logo from '../Logo'

const StyledListLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function ListLogo({
  logoURI,
  style,
  size = '24px',
  defaultText
}: {
  logoURI: string
  size?: string
  style?: React.CSSProperties
  defaultText: string
}) {
  const srcs: string[] = useHttpLocations(logoURI)

  return <StyledListLogo alt={defaultText} defaultText={defaultText} size={size} srcs={srcs} style={style} />
}
