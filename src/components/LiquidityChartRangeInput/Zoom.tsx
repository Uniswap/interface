import { ButtonGray } from 'components/Button'
import { ScaleLinear, select, zoom, ZoomBehavior, zoomIdentity, ZoomTransform } from 'd3'
import React, { useEffect, useMemo, useRef } from 'react'
import { RefreshCcw, ZoomIn, ZoomOut } from 'react-feather'
import styled from 'styled-components/macro'

import { ZoomLevels } from './types'

const Wrapper = styled.div<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ count }) => count.toString()}, 1fr);
  grid-gap: 6px;

  position: absolute;
  top: -75px;
  right: 0;
`

const Button = styled(ButtonGray)`
  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
    color: ${({ theme }) => theme.textPrimary};
  }

  width: 32px;
  height: 32px;
  padding: 4px;
`

export const ZoomOverlay = styled.rect`
  fill: transparent;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`

export default function Zoom({
  svg,
  xScale,
  setZoom,
  width,
  height,
  resetBrush,
  showResetButton,
  zoomLevels,
}: {
  svg: SVGElement | null
  xScale: ScaleLinear<number, number>
  setZoom: (transform: ZoomTransform) => void
  width: number
  height: number
  resetBrush: () => void
  showResetButton: boolean
  zoomLevels: ZoomLevels
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut, zoomInitial, zoomReset] = useMemo(
    () => [
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 2),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .call(zoomBehavior.current.transform, zoomIdentity.translate(0, 0).scale(1))
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svg]
  )

  useEffect(() => {
    if (!svg) return

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => setZoom(transform))

    select(svg as Element).call(zoomBehavior.current)
  }, [height, width, setZoom, svg, xScale, zoomBehavior, zoomLevels, zoomLevels.max, zoomLevels.min])

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial()
  }, [zoomInitial, zoomLevels])

  return (
    <Wrapper count={showResetButton ? 3 : 2}>
      {showResetButton && (
        <Button
          onClick={() => {
            resetBrush()
            zoomReset()
          }}
          disabled={false}
        >
          <RefreshCcw size={16} />
        </Button>
      )}
      <Button onClick={zoomIn} disabled={false}>
        <ZoomIn size={16} />
      </Button>
      <Button onClick={zoomOut} disabled={false}>
        <ZoomOut size={16} />
      </Button>
    </Wrapper>
  )
}
