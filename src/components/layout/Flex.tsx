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
      centered: true
      justifyContent?: 'center'
    }

type FlexProps = ComponentProps<typeof Box> &
  CenteredProps & {
    /** spacing _between_ elements */
    gap?: keyof Theme['spacing']
  }

/** Layout component to place child items with spacing between them */
export function Flex({
  alignItems = 'stretch',
  centered = false,
  children,
  flexBasis = 'auto',
  flexDirection = 'row',
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
      flexDirection={flexDirection}
      flexShrink={flexShrink}
      flexGrow={flexGrow}
      flexBasis={flexBasis}
      flexWrap={flexWrap}
      justifyContent={centered ? 'center' : justifyContent}
      alignItems={centered ? 'center' : alignItems}
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
