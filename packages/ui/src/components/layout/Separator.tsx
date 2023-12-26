import { isWeb, Stack, styled } from 'tamagui'

export const Separator = styled(Stack, {
  name: 'Separator',
  borderColor: '$surface3',
  flexShrink: 0,
  borderWidth: 0,
  flex: 1,
  height: 0,
  maxHeight: 0,
  borderBottomWidth: 1,

  variants: {
    test: {
      ok: {},
    },

    vertical: {
      true: {
        y: 0,
        // `as any` because its valid only on web
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        height: isWeb ? ('initial' as any) : 'auto',
        // `as any` because its valid only on web
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maxHeight: isWeb ? ('initial' as any) : 'auto',
        width: 0,
        maxWidth: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0.25,
      },
    },
  } as const,
})
