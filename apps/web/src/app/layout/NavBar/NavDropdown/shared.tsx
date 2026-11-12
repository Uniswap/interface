import { cn, Flex, type FlexCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

// Explicit return types: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const NavDropdownDefaultWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FlexCompatProps>(function NavDropdownDefaultWrapper(
    { $sm: sm, className, ...props },
    ref,
  ) {
    return (
      <Flex
        ref={ref}
        width="100%"
        alignItems="center"
        gap="$spacing2"
        className={cn(
          'media-sm:[border-bottom-left-radius:0px] media-sm:[border-bottom-right-radius:0px] media-sm:[border-bottom-width:0px]',
          className,
        )}
        $sm={{
          width: '100%',
          ...sm,
        }}
        {...props}
      />
    )
  })

export const NavDropdownTabWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FlexCompatProps>(function NavDropdownTabWrapper(props, ref) {
    return <Flex ref={ref} minWidth={180} p="$spacing4" gap="$gap4" position="relative" {...props} />
  })
