import React, { useEffect, useMemo, useRef } from 'react'
import { ButtonGray } from 'components/Button'
import styled from 'styled-components/macro'
import { ScaleLinear, select, ZoomBehavior, zoom, ZoomTransform } from 'd3'
import { ZoomIn, ZoomOut } from 'react-feather'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 6px;

  position: absolute;
  top: -60px;
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
}: {
  svg: SVGSVGElement | null
  xScale: ScaleLinear<number, number>
  setZoom: (transform: ZoomTransform) => void
  innerWidth: number
  innerHeight: number
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut] = useMemo(
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
    ],
    [svg, zoomBehavior]
  )

  useEffect(() => {
    if (!svg) return

    // zoom
    zoomBehavior.current = zoom()
      .scaleExtent([0.2, 25])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => setZoom(transform))

    select(svg)
      // @ts-ignore
      .call(zoomBehavior.current)
      // disables dragging/panning
      .on('mousedown.zoom', null)
  }, [innerHeight, innerWidth, setZoom, svg, xScale, zoomBehavior])

  return (
    <Wrapper>
      <Button onClick={zoomIn} disabled={false}>
        <ZoomIn size={16} />
      </Button>
      <Button onClick={zoomOut} disabled={false}>
        <ZoomOut size={16} />
      </Button>
    </Wrapper>
  )
}
