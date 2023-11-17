import { CrosshairMode, MouseEventParams, SeriesAttachedParameter, Time } from 'lightweight-charts'
import React, { useEffect, useState } from 'react'

interface BitmapPositionLength {
  /** coordinate for use with a bitmap rendering scope */
  position: number
  /** length for use with a bitmap rendering scope */
  length: number
}

/**
 * Calculates the bitmap position for an item with a desired length (height or width), and centred according to
 * an position coordinate defined in media sizing.
 * @param positionMedia - position coordinate for the bar (in media coordinates)
 * @param pixelRatio - pixel ratio. Either horizontal for x positions, or vertical for y positions
 * @param desiredWidthMedia - desired width (in media coordinates)
 * @returns Position of of the start point and length dimension.
 */
function positionsLine(
  positionMedia: number,
  pixelRatio: number,
  desiredWidthMedia = 1,
  widthIsBitmap?: boolean
): BitmapPositionLength {
  const scaledPosition = Math.round(pixelRatio * positionMedia)
  const lineBitmapWidth = widthIsBitmap ? desiredWidthMedia : Math.round(desiredWidthMedia * pixelRatio)
  const offset = centreOffset(lineBitmapWidth)
  const position = scaledPosition - offset
  return { position, length: lineBitmapWidth }
}

interface CrosshairHighlightData {
  x: number
  visible: boolean
  color: string
  barSpacing: number
}

const defaultOptions: HighlightBarCrosshairOptions = {
  color: 'rgba(0, 0, 0, 0.2)',
}

interface HighlightBarCrosshairOptions {
  color: string
}

const CrosshairHighlightPrimitive: React.FC<Partial<HighlightBarCrosshairOptions>> = (options) => {
  const [optionsState, setOptionsState] = useState<HighlightBarCrosshairOptions>({
    ...defaultOptions,
    ...options,
  })
  const [paneViews, setPaneViews] = useState<CrosshairHighlightPaneView[]>([])
  const [data, setData] = useState<CrosshairHighlightData>({
    x: 0,
    visible: false,
    color: 'rgba(0, 0, 0, 0.2)',
    barSpacing: 6,
  })
  const [attachedParams, setAttachedParams] = useState<SeriesAttachedParameter<Time> | undefined>()

  useEffect(() => {
    setPaneViews([new CrosshairHighlightPaneView(data)])
  }, [data])

  useEffect(() => {
    if (attachedParams) {
      setCrosshairMode()
      attachedParams.chart.subscribeCrosshairMove(moveHandler)
    }
    return () => {
      const chart = chart()
      if (chart) {
        chart.unsubscribeCrosshairMove(moveHandler)
      }
    }
  }, [attachedParams])

  const updateAllViews = () => {
    paneViews.forEach((pw) => pw.update(data))
  }

  const currentColor = () => {
    return optionsState.color
  }

  const chart = () => {
    return attachedParams?.chart
  }

  const setCrosshairMode = () => {
    const chart = chart()
    if (!chart) {
      throw new Error('Unable to change crosshair mode because the chart instance is undefined')
    }
    chart.applyOptions({
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          visible: false,
        },
      },
    })
  }

  const moveHandler = (param: MouseEventParams) => onMouseMove(param)

  const barSpacing = () => {
    const chart = chart()
    if (!chart) return 6
    const ts = chart.timeScale()
    const visibleLogicalRange = ts.getVisibleLogicalRange()
    if (!visibleLogicalRange) return 6
    return ts.width() / (visibleLogicalRange.to - visibleLogicalRange.from)
  }

  const onMouseMove = (param: MouseEventParams) => {
    const chart = chart()
    const logical = param.logical
    if (!logical || !chart) {
      setData({
        x: 0,
        visible: false,
        color: currentColor(),
        barSpacing: barSpacing(),
      })
      return
    }
    const coordinate = chart.timeScale().logicalToCoordinate(logical)
    setData({
      x: coordinate ?? 0,
      visible: coordinate !== null,
      color: currentColor(),
      barSpacing: barSpacing(),
    })
  }

  return null
}
