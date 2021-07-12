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
  innerWidth,
  innerHeight,
  showClear,
  zoomLevels,
}: {
  svg: SVGSVGElement | null
  xScale: ScaleLinear<number, number>
  setZoom: (transform: ZoomTransform) => void
  innerWidth: number
  innerHeight: number
  showClear: boolean
  zoomLevels: ZoomLevels
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut, reset] = useMemo(
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
    ],
    [svg, zoomBehavior]
  )

  useEffect(() => {
    if (!svg) return

    // zoom
    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => setZoom(transform))

    select(svg as Element)
      .call(zoomBehavior.current)
      .on('mousedown.zoom', null)
  }, [innerHeight, innerWidth, setZoom, svg, xScale, zoomBehavior, zoomLevels.max, zoomLevels.min])

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
