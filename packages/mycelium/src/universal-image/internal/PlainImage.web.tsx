import { isTestEnv } from '@universe/environment'
import type { JSX } from 'react'
import { useImageLoadError } from '../hooks/useImageLoadError'
import { type PlainImageProps, UniversalImageResizeMode } from '../types'

export function PlainImage({
  alt,
  uri,
  size,
  fallback,
  resizeMode,
  style,
  testID,
  onLoad,
  onError,
}: PlainImageProps): JSX.Element {
  const { hasError, handleError } = useImageLoadError(uri, onError)

  if (hasError && fallback) {
    return fallback
  }

  // TODO cover all cases better
  const objectFit =
    resizeMode === UniversalImageResizeMode.Contain || resizeMode === UniversalImageResizeMode.Cover
      ? resizeMode
      : 'contain'

  const imgElement = (
    <img
      // remount on uri change: a queued error event for the old src can fire after the new src
      // commits to the same element, which would mark the new uri as errored
      key={uri}
      alt={alt}
      height={size.height}
      src={uri}
      // width/height also set as inline CSS: global stylesheet rules (img { height: auto }) override
      // the HTML size attributes, which let non-square images escape their intended box
      style={{ objectFit, aspectRatio: size.aspectRatio, width: size.width, height: size.height, ...style }}
      width={size.width}
      onError={handleError}
      onLoad={onLoad}
    />
  )

  // TODO(MOB-3485): remove test run special casing
  if (isTestEnv()) {
    // isTestEnv() is also true in the Playwright e2e build (IS_E2E_TEST=true), where this wrapper
    // renders in a real browser: pin the layout-consequential declarations the replaced Tamagui
    // Flex had (display/direction plus its flexShrink/minWidth/boxSizing resets), or the img
    // becomes an inline-level box and the wrapper gains descender space below it.
    return (
      // oxlint-disable-next-line react/forbid-elements -- test-only wrapper; stays a plain div (no Tamagui Flex in the rebuilt lane)
      <div
        data-testid={testID}
        style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0, minWidth: 0 }}
      >
        {imgElement}
      </div>
    )
  } else {
    return imgElement
  }
}
