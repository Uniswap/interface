import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

export const PAGE_WRAPPER_MAX_WIDTH = 480

// Explicit return types: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const PageWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function PageWrapper({ $lg: lg, $md: md, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      pt="$spacing60"
      px="$spacing8"
      pb="$spacing40"
      // Merged explicitly, not spread: a plain spread would replace this base wholesale.
      $lg={{ pt: '$spacing48', ...lg }}
      $md={{ pt: '$spacing20', px: '$none', ...md }}
      {...props}
    />
  )
})

export const SwapModuleWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function SwapModuleWrapper(props, ref) {
  return <Flex ref={ref} width={PAGE_WRAPPER_MAX_WIDTH} {...props} />
})

export type ArrowWrapperProps = FlexCompatProps & { clickable?: boolean }

export const ArrowWrapper: ForwardRefExoticComponent<ArrowWrapperProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  ArrowWrapperProps
>(function ArrowWrapper({ clickable, hoverStyle, ...rest }, ref) {
  return (
    <Flex
      ref={ref}
      display="flex"
      borderRadius="$rounded12"
      height={40}
      width={40}
      position="relative"
      mt={-18}
      mb={-18}
      ml="auto"
      mr="auto"
      backgroundColor="$surface2"
      borderWidth="$spacing4"
      borderStyle="solid"
      borderColor="$surface1"
      zIndex={2}
      // The legacy `clickable` variant table declared only a `true` branch, so `false` is a no-op.
      // Merged explicitly, not spread: a plain spread would replace this base wholesale.
      hoverStyle={clickable ? { cursor: 'pointer', opacity: 0.8, ...hoverStyle } : hoverStyle}
      {...rest}
    />
  )
})

export const SwapSection: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function SwapSection({ hoverStyle, focusWithinStyle, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      height="120px"
      p="$spacing16"
      position="relative"
      borderStyle="solid"
      borderWidth="$spacing1"
      borderColor="$surface2"
      // Merged explicitly, not spread: a plain spread would replace this base wholesale.
      hoverStyle={{ borderColor: '$surface2Hovered', ...hoverStyle }}
      focusWithinStyle={{ borderColor: '$surface3', ...focusWithinStyle }}
      {...props}
    />
  )
})

export const ArrowContainer: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function ArrowContainer(props, ref) {
  return (
    <Flex
      ref={ref}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      {...props}
    />
  )
})
