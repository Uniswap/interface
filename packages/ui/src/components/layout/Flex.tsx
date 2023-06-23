import { Stack, styled } from 'tamagui'

export const Flex = styled(Stack, {
  flexDirection: 'column',
  flexWrap: 'wrap',

  variants: {
    row: {
      true: {
        flexDirection: 'row',
      },
    },

    shrink: {
      true: {
        flexShrink: 1,
      },
    },

    grow: {
      true: {
        flexGrow: 1,
      },
    },

    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  } as const,
})
