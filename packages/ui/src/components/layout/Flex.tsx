import { Stack, StackProps, styled } from 'tamagui'

export type FlexProps = StackProps & {
  row?: boolean
  shrink?: boolean
  grow?: boolean
  fill?: boolean
  centered?: boolean
}

export const Flex = styled(Stack, {
  flexDirection: 'column',
  gap: '$spacing16',

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

    fill: {
      true: {
        flex: 1,
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
