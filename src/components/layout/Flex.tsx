import React, { ComponentProps, useMemo } from 'react'
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

export type FlexProps = ComponentProps<typeof Box> &
  CenteredProps & {
    /** spacing _between_ elements */
    gap?: keyof Theme['spacing']
  }

/**
 * Layout component to place child items with spacing between them
 * TODO:
 *  - shorthand for flexDirection (and other props?)
 *  - make `flex` a boolean prop to set `flex={1}`
 * */
export function Flex({
  alignItems = 'stretch',
  centered = false,
  children,
  flexBasis = 'auto',
  flexDirection = 'column',
  flexGrow = 0,
  flexShrink = 0,
  flexWrap = 'nowrap',
  gap = 'md',
  justifyContent = 'flex-start',
  ...boxProps
}: FlexProps) {
  const childrenArr = useMemo(() => React.Children.toArray(children).filter((c) => !!c), [children])
  const spacerProps = useMemo(
    () => ({
      x: flexDirection === 'row' || flexDirection === 'row-reverse' ? gap : undefined,
      y: flexDirection === 'column' || flexDirection === 'column-reverse' ? gap : undefined,
    }),
    [flexDirection, gap]
  )
  return (
    <Box
      alignItems={centered ? 'center' : alignItems}
      flexBasis={flexBasis}
      flexDirection={flexDirection}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
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
