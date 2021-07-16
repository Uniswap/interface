import React, { useEffect, useMemo, useRef } from 'react'
import { ButtonGray } from 'components/Button'
import styled from 'styled-components/macro'
import { ScaleLinear, select, ZoomBehavior, zoom, ZoomTransform } from 'd3'
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
  setZoom,
  width,
  height,
  showClear,
  zoomLevels,
}: {
  svg: SVGElement | null
  xScale: ScaleLinear<number, number>
  setZoom: (transform: ZoomTransform) => void
  width: number
  height: number
  showClear: boolean
  zoomLevels: ZoomLevels
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut, reset, initial] = useMemo(
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
          .call(zoomBehavior.current.scaleTo, 1),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svg, zoomBehavior]
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
