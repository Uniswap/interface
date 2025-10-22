// biome-ignore lint/style/noRestrictedImports: Test utilities need direct access to format functions
import { UseMediaState } from '@tamagui/core'
import { mocked } from 'test-utils/mocked'
import { useMedia } from 'ui/src'

function getMediaState(size: keyof UseMediaState) {
  const mediaState: UseMediaState = {
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
      mediaState[key as keyof UseMediaState] = true
    }
  })
  return mediaState
}

function mockMediaSize(size: keyof UseMediaState) {
  mocked(useMedia).mockReturnValue(getMediaState(size))
}

export default mockMediaSize
