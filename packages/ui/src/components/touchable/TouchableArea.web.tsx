import { styled, YStack } from 'tamagui'

// TODO(EXT-248)
// this is for web, much simpler, once we're ready we can import the TouchableArea
// from mobile and throw it in `TouchableArea.native.tsx`

export const TouchableArea = styled(YStack, {
  cursor: 'pointer',
  animation: 'quick',

  pressStyle: {
    backgroundColor: '$backgroundPress',
  },
})
