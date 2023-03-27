import { Stack, styled } from 'tamagui'

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
