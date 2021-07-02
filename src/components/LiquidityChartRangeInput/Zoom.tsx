import React, { useEffect, useMemo, useRef } from 'react'
import { ButtonEmpty } from 'components/Button'
import styled from 'styled-components'
import { ScaleLinear, select, ZoomBehavior, zoom, ZoomTransform } from 'd3'
import { ZoomIn, ZoomOut } from 'react-feather'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  position: absolute;
  top: -55px;
  right: 0;
`

const Button = styled(ButtonEmpty)`
  color: ${({ theme }) => theme.text1};
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
      .scaleExtent([0.01, 10])
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
      <Button onClick={zoomOut} disabled={false} width="40px" padding="4px">
        <ZoomOut size={18} />
      </Button>
      <Button onClick={zoomIn} disabled={false} width="40px" padding="4px">
        <ZoomIn size={18} />
      </Button>
    </Wrapper>
  )
}
