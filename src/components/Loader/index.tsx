import React from 'react'

import styled from 'styled-components'

import { Spinner } from '../../theme'
import Circle from '../../assets/images/blue-loader.svg'

const SpinnerWrapper = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export default function Loader({ size }: { size: string }) {
  return <SpinnerWrapper src={Circle} alt="loader" size={size}/>
}
