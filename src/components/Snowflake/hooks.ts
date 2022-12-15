import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'

import Snowflake, { SnowflakeConfig } from './Snowflake'
import { snowfallBaseStyle } from './config'
import { getSize } from './utils'

/**
 * A utility function to create a collection of snowflakes
 * @param canvasRef A ref to the canvas element
 * @param amount The number of snowflakes
 * @param config The configuration for each snowflake
 */
const createSnowflakes = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  amount: number,
  config: SnowflakeConfig,
): Snowflake[] => {
  if (!canvasRef.current) return []

  const snowflakes: Snowflake[] = []

  for (let i = 0; i < amount; i++) {
    snowflakes.push(new Snowflake(canvasRef.current, config))
  }

  return snowflakes
}

/**
 * A utility hook to manage creating and updating a collection of snowflakes
 * @param canvasRef A ref to the canvas element
 * @param amount The number of snowflakes
 * @param config The configuration for each snowflake
 */
export const useSnowflakes = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  amount: number,
  config: SnowflakeConfig,
) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([])

  // Handle change of amount
  useEffect(() => {
    setSnowflakes(snowflakes => {
      const sizeDifference = amount - snowflakes.length

      if (sizeDifference > 0) {
        return [...snowflakes, ...createSnowflakes(canvasRef, sizeDifference, config)]
      }

      if (sizeDifference < 0) {
        return snowflakes.slice(0, amount)
      }

      return snowflakes
    })
  }, [amount, canvasRef, config])

  // Handle change of config
  useEffect(() => {
    setSnowflakes(snowflakes =>
      snowflakes.map(snowflake => {
        snowflake.updateConfig(config)
        return snowflake
      }),
    )
  }, [config])

  return snowflakes
}

/**
 * Returns the height and width of a HTML element, uses the `ResizeObserver` api if available to detect changes to the
 * size. Falls back to listening for resize events on the window.
 * @param ref A ref to the HTML element to be measured
 */
export const useComponentSize = (ref: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState(getSize(ref.current))

  const resizeHandler = useCallback(() => {
    if (ref.current) {
      setSize(getSize(ref.current))
    }
  }, [ref])

  useLayoutEffect(() => {
    const { ResizeObserver } = window

    if (!ref.current) return
    resizeHandler()

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(resizeHandler)
      resizeObserver.observe(ref.current)

      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resizeHandler)

      return () => window.removeEventListener('resize', resizeHandler)
    }
  }, [ref, resizeHandler])

  return size
}

/**
 * Utility hook that merges any provided styles with the default styles
 * @param overrides The style prop passed into the component
 */
export const useSnowfallStyle = (overrides?: React.CSSProperties): React.CSSProperties => {
  const styles = useMemo(
    () => ({
      ...snowfallBaseStyle,
      ...(overrides || {}),
    }),
    [overrides],
  )

  return styles
}

/**
 * Same as `React.useEffect` but uses a deep comparison on the dependency array. This should only
 * be used when working with non-primitive dependencies.
 *
 * @param effect Effect callback to run
 * @param deps Effect dependencies
 */
export function useDeepCompareEffect(effect: React.EffectCallback, deps: React.DependencyList) {
  const ref = useRef<React.DependencyList>(deps)

  // Only update the current dependencies if they are not deep equal
  if (!isEqual(deps, ref.current)) {
    ref.current = deps
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useEffect(effect, ref.current)
}

/**
 * Utility hook to stabilize a reference to a value, the returned value will always match the input value
 * but (unlike an inline object) will maintain [SameValueZero](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * equality until a change is made.
 *
 * @example
 *
 * const obj = useDeepMemo({ foo: 'bar', bar: 'baz' }) // <- inline object creation
 * const prevValue = usePrevious(obj) // <- value from the previous render
 * console.log(obj === prevValue) // <- always logs true until value changes
 */
export function useDeepMemo<T>(value: T): T {
  const [state, setState] = useState(value)

  useDeepCompareEffect(() => setState(value), [value])

  return state
}
