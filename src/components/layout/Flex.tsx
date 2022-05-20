import React, { ComponentProps, useMemo } from 'react'
import { withAnimated } from 'src/components/animated'
import { Box } from 'src/components/layout/Box'
import { Spacer } from 'src/components/layout/Spacer'
import { Theme } from 'src/styles/theme'

type CenteredProps =
  | {
      centered?: false
    }
  | {
      alignItems?: 'center'
      /** shorthand for `alignItems='center' justifyContent='center'` */
      centered: true
      justifyContent?: 'center'
    }

type DirectionProps =
  | {
      row: true
    }
  | {
      row?: boolean
      flexDirection?: ComponentProps<typeof Box>['flexDirection']
    }

type LayoutShorthandProps = {
  fill?: boolean // flex=1
  grow?: boolean // flexGrow=1
  shrink?: boolean // flexShrink=1
}

export type FlexProps = ComponentProps<typeof Box> &
  CenteredProps &
  DirectionProps & {
    /** spacing _between_ elements */
    gap?: keyof Theme['spacing']
  } & LayoutShorthandProps

/**
 * Layout component to place child items with spacing between them
 */
export function Flex({
  alignItems = 'stretch',
  centered = false,
  children,
  fill,
  flexBasis,
  flexDirection = 'column',
  flexGrow,
  flexShrink,
  flexWrap,
  gap = 'md',
  grow,
  justifyContent = 'flex-start',
  row,
  shrink,
  ...boxProps
}: FlexProps) {
  const childrenArr = useMemo(() => React.Children.toArray(children).filter((c) => !!c), [children])
  const spacerProps = useMemo(
    () => ({
      x: row || flexDirection === 'row' || flexDirection === 'row-reverse' ? gap : undefined,
      y: flexDirection === 'column' || flexDirection === 'column-reverse' ? gap : undefined,
    }),
    [flexDirection, gap, row]
  )
  return (
    <Box
      alignItems={centered ? 'center' : alignItems}
      flex={fill ? 1 : undefined}
      flexBasis={flexBasis}
      flexDirection={row ? 'row' : flexDirection}
      flexGrow={grow ? 1 : flexGrow}
      flexShrink={shrink ? 1 : flexShrink}
      flexWrap={flexWrap}
      justifyContent={centered ? 'center' : justifyContent}
      {...boxProps}>
      {childrenArr.map((child, index, array) => (
        <React.Fragment key={index}>
          {child}
          {gap && index < array.length - 1 && <Spacer {...spacerProps} />}
        </React.Fragment>
      ))}
    </Box>
  )
}

export const AnimatedFlex = withAnimated(Flex)
