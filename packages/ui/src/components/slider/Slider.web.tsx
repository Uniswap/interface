import { Flex } from '@universe/mycelium'
import { type RefObject, useRef } from 'react'
import type { SliderProps } from 'ui/src/components/slider/Slider'
import { useEvent } from 'utilities/src/react/hooks'

export type { SliderProps } from 'ui/src/components/slider/Slider'

/**
 * Controlled slider built on mycelium `Flex` only — no Tamagui/Radix runtime. The container owns the
 * gesture (pointer capture + geometry off its own rect, reliable inside portaled/animated popovers where
 * a measure()-based responder is not) and the thumb is `pointerEvents: none`. Pointer drag is continuous;
 * arrow keys nudge by `step`. Mirrors the web ValuationSlider pattern.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  trackColor = '$surface3',
  activeColor = '$accent1',
  thumbColor = '$neutral1',
  trackHeight = 4,
  thumbSize = 16,
  height = 24,
  ariaLabel,
  ariaValueText,
  disabled = false,
}: SliderProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const span = max - min
  const current = Math.max(min, Math.min(max, value))
  const fraction = span <= 0 ? 0 : (current - min) / span

  const emitFromClientX = useEvent((clientX: number): void => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || span <= 0) {
      return
    }
    const f = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onChange(min + f * span)
  })

  const onPointerDown = useEvent((e: PointerEvent): void => {
    if (disabled) {
      return
    }
    containerRef.current?.setPointerCapture(e.pointerId)
    emitFromClientX(e.clientX)
  })

  const onPointerMove = useEvent((e: PointerEvent): void => {
    if (disabled || !containerRef.current?.hasPointerCapture(e.pointerId)) {
      return
    }
    emitFromClientX(e.clientX)
  })

  const onKeyDown = useEvent((e: KeyboardEvent): void => {
    if (disabled) {
      return
    }
    const direction =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (direction === 0) {
      return
    }
    e.preventDefault()
    // Round to the step's precision so arrow keys stay on the grid: 1.2 - 0.1 is 1.0999… otherwise,
    // which a caller flooring to 2dp reads as 1.09.
    const decimals = (String(step).split('.')[1] ?? '').length
    const next = Number((current + direction * step).toFixed(decimals))
    onChange(Math.max(min, Math.min(max, next)))
  })

  // Keep the thumb fully inside the track at the extremes; its center would otherwise hang half off.
  const thumbLeft = `calc(${fraction * 100}% + ${(0.5 - fraction) * thumbSize}px)`

  return (
    <Flex
      ref={containerRef as RefObject<HTMLDivElement>}
      width="100%"
      height={height}
      justifyContent="center"
      position="relative"
      cursor={disabled ? 'default' : 'pointer'}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={ariaValueText}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      // Claim the gesture on touch devices; without it the browser's pan can seize the drag mid-stroke
      // (pointercancel) inside a scrollable modal shell.
      style={{ touchAction: 'none' }}
      // mycelium's Flex types pointer/keyboard handlers with RN event types; ours are DOM-typed, so cast
      // through (event: unknown) without losing type safety inside the handlers.
      onPointerDown={onPointerDown as unknown as (event: unknown) => void}
      onPointerMove={onPointerMove as unknown as (event: unknown) => void}
      onKeyDown={onKeyDown as unknown as (event: unknown) => void}
    >
      <Flex
        width="100%"
        height={trackHeight}
        borderRadius="$roundedFull"
        backgroundColor={trackColor}
        overflow="hidden"
      >
        <Flex
          height="100%"
          borderRadius="$roundedFull"
          backgroundColor={activeColor}
          style={{ width: `${fraction * 100}%` }}
        />
      </Flex>
      <Flex
        position="absolute"
        width={thumbSize}
        height={thumbSize}
        borderRadius="$roundedFull"
        backgroundColor={thumbColor}
        pointerEvents="none"
        style={{ left: thumbLeft, top: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </Flex>
  )
}
