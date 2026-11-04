import { Flex, type FlexCompatProps, fonts, type TextVariantKey } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

const LOADER_PADDING = 2
export function TextLoader({ variant, width }: { variant: TextVariantKey; width: number }) {
  const height = fonts[variant].lineHeight

  return (
    <Flex
      backgroundColor="$surface3"
      borderRadius="$rounded6"
      width={width}
      height={height - LOADER_PADDING * 2}
      my={LOADER_PADDING}
    />
  )
}

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const LoadingRow: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function LoadingRow(props, ref) {
  return <Flex ref={ref} my="$spacing16" {...props} />
})
