import React from 'react'
import { ButtonGray } from 'components/Button'
import { useContext } from 'react'
import { ChartContext } from './hooks'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 4px;
`

export default function ZoomButtons() {
  const { canZoomIn, canZoomOut, zoomIn, zoomOut } = useContext(ChartContext)

  return (
    <Wrapper>
      <ButtonGray onClick={zoomOut} disabled={!canZoomOut} width="40px" padding="4px">
        -
      </ButtonGray>
      <ButtonGray onClick={zoomIn} disabled={!canZoomIn} width="40px" padding="4px">
        +
      </ButtonGray>
    </Wrapper>
  )
}
