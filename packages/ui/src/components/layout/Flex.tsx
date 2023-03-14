import { Stack, styled } from '@tamagui/core'

export const Flex = styled(Stack, {
  name: 'Flex',

  flexDirection: 'column',
  variants: {
    row: {
      true: {
        flexDirection: 'row',
      },
    },
  },
})
