import React, { useCallback, useEffect, useRef } from 'react'

import { SnowflakeProps, defaultConfig } from './Snowflake'
import { targetFrameTime } from './config'
import { useComponentSize, useDeepMemo, useSnowfallStyle, useSnowflakes } from './hooks'

export interface SnowfallProps extends Partial<SnowflakeProps> {
  /**
   * The number of snowflakes to be rendered.
   *
   * The default value is 150.
   */
  snowflakeCount?: number
  /**
   * Any style properties that will be passed to the canvas element.
   */
  style?: React.CSSProperties
}

const Snowfall = ({
  color = defaultConfig.color,
  changeFrequency = defaultConfig.changeFrequency,
  radius = defaultConfig.radius,
  speed = defaultConfig.speed,
  wind = defaultConfig.wind,
  rotationSpeed = defaultConfig.rotationSpeed,
  snowflakeCount = 150,
  images,
  style,
}: SnowfallProps = {}): JSX.Element => {
  const mergedStyle = useSnowfallStyle(style)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasSize = useComponentSize(canvasRef)
  const animationFrame = useRef(0)

  const lastUpdate = useRef(performance.now())
  const config = useDeepMemo<SnowflakeProps>({ color, changeFrequency, radius, speed, wind, rotationSpeed, images })
  const snowflakes = useSnowflakes(canvasRef, snowflakeCount, config)

  const render = useCallback(
    (framesPassed = 1) => {
      const canvas = canvasRef.current
      if (canvas) {
        // Update the positions of the snowflakes
        snowflakes.forEach(snowflake => snowflake.update(canvas, framesPassed))

        // Render them if the canvas is available
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

          snowflakes.forEach(snowflake => snowflake.draw(ctx))
        }
      }
    },
    [snowflakes],
  )

  const loop = useCallback(() => {
    // Update based on time passed so that a slow frame rate won't slow down the snowflake
    const now = performance.now()
    const msPassed = performance.now() - lastUpdate.current
    lastUpdate.current = now

    // Frames that would have passed if running at 60 fps
    const framesPassed = msPassed / targetFrameTime

    render(framesPassed)

    animationFrame.current = requestAnimationFrame(loop)
  }, [render])

  useEffect(() => {
    loop()
    return () => cancelAnimationFrame(animationFrame.current)
  }, [loop])

  return (
    <canvas
      ref={canvasRef}
      height={canvasSize.height}
      width={canvasSize.width}
      style={mergedStyle}
      data-testid="SnowfallCanvas"
    />
  )
}

export default Snowfall
