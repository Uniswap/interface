import React, { useEffect, useMemo, useRef } from 'react'
import { ButtonEmpty } from 'components/Button'
import styled from 'styled-components'
import { ScaleLinear, select, ZoomBehavior, zoom, ZoomTransform } from 'd3'
import { ZoomIn, ZoomOut } from 'react-feather'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 4px;

  position: absolute;
  top: -40px;
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
  const zoomRef = useRef<ZoomBehavior<Element, unknown>>()

  const [zoomIn, zoomOut] = useMemo(
    () => [
      () =>
        svg &&
        zoomRef.current &&
        select(svg)
          //.transition()
          // @ts-ignore
          .call(zoomRef.current.scaleBy, 2),
      () =>
        svg &&
        zoomRef.current &&
        //.transition()
        select(svg)
          // @ts-ignore
          .call(zoomRef.current.scaleBy, 0.5),
    ],
    [svg, zoomRef]
  )

  useEffect(() => {
    console.log(xScale.domain())
  }, [xScale])

  useEffect(() => {
    if (!svg) return

    function zoomed({ transform }: { transform: ZoomTransform }) {
      setZoom(transform)
    }

    // zoom
    zoomRef.current = zoom()
      .scaleExtent([0.5, 100])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      //.filter(() => false)
      .on('zoom', zoomed)

    select(svg)
      // @ts-ignore
      .call(zoomRef.current)
      // disables dragging/panning
      .on('mousedown.zoom', null)
  }, [innerHeight, innerWidth, setZoom, svg, xScale, zoomRef])

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
