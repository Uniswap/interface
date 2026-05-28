import { type MediaQueryState, useMedia } from 'ui/src'
import { mocked } from '~/test-utils/mocked'

function getMediaState(size: keyof MediaQueryState) {
  const mediaState: MediaQueryState = {
    xxs: false,
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
    xxxl: false,
    short: false,
    midHeight: false,
    lgHeight: false,
  }
  const mediaStateKeys = Object.keys(mediaState)
  mediaStateKeys.forEach((key, i) => {
    const index = mediaStateKeys.indexOf(size)
    if (i >= index && key !== 'short' && key !== 'midHeight' && key !== 'lgHeight') {
      mediaState[key as keyof MediaQueryState] = true
    }
  })
  return mediaState
}

export function mockMediaSize(size: keyof MediaQueryState) {
  mocked(useMedia).mockReturnValue(getMediaState(size))
}
