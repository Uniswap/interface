import { Flex } from '@universe/mycelium'
import { useShadowPropsShort } from '@universe/mycelium/theme-hooks-compat'
import { ComponentProps, forwardRef, PropsWithChildren } from 'react'

type TooltipContainerProps = PropsWithChildren<ComponentProps<typeof Flex>>

export const TooltipContainer = forwardRef<HTMLDivElement, TooltipContainerProps>(function TooltipContainer(
  { children, ...props },
  ref,
) {
  const shadowProps = useShadowPropsShort()
  // On web the hook returns only { '$platform-web': { boxShadow } }; the full return type also
  // carries the native shadow* branch, whose Tamagui-typed shadowColor the compat Flex rejects.
  const boxShadow = shadowProps['$platform-web']?.boxShadow

  return (
    <Flex
      ref={ref}
      position="absolute"
      pointerEvents="none"
      backgroundColor="$surface1"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded6"
      $platform-web={{ boxShadow }}
      {...props}
    >
      {children}
    </Flex>
  )
})
