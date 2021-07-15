import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { ButtonGray } from 'components/Button'
import styled from 'styled-components/macro'
import { ScaleLinear, select, ZoomBehavior, zoom, ZoomTransform, brush, zoomIdentity } from 'd3'
import { RefreshCcw, ZoomIn, ZoomOut } from 'react-feather'
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
    background-color: ${({ theme }) => theme.bg2};
    color: ${({ theme }) => theme.text1};
  }

  width: 32px;
  height: 32px;
  padding: 4px;
`

export default function Zoom({
  svg,
  xScale,
  brushExtent, // rename to signify position
  zoomTransform,
  setZoom,
  width,
  height,
  showClear,
  zoomLevels,
}: {
  svg: SVGElement | null
  xScale: ScaleLinear<number, number>
  brushExtent: [number, number]
  zoomTransform: ZoomTransform | null
  setZoom: (transform: ZoomTransform) => void
  width: number
  height: number
  showClear: boolean
  zoomLevels: ZoomLevels
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut, initial] = useMemo(
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
    ],
    [svg]
  )

  const reset = useCallback(() => {
    const scaled = brushExtent.map(xScale)
    const brushWidth = scaled[1] - scaled[0]
    svg &&
      zoomBehavior.current &&
      select(svg as Element)
        .transition()
        .call(
          zoomBehavior.current.transform,
          zoomIdentity
            .translate(width / 2, height / 2)
            .scale(0.5)
            .translate(-(scaled[0] + brushWidth / 2), 0)
        )
  }, [brushExtent, xScale, svg, width, height])

  // initialize zoom behavior
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

  // reset zoom to initial on zoomLevel change
  useEffect(() => {
    initial()
  }, [initial, zoomLevels])

  return (
    <Wrapper count={showClear ? 3 : 2}>
      {showClear && (
        <Button onClick={reset} disabled={false}>
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
