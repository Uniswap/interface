import React from 'react'
import styled from 'styled-components'
import useHttpLocations from '../../hooks/useHttpLocations'

import Logo from '../Logo'

const StyledListLogo = styled(Logo)`
  width: 100px;
`

export default function ListLogo({
  logoURI,
  style,
  alt
}: {
  logoURI: string
  size?: string
  style?: React.CSSProperties
  alt?: string
}) {
  const srcs: string[] = useHttpLocations(logoURI)

  return <StyledListLogo alt={alt} srcs={srcs} style={style} />
}
