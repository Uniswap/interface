import clsx, { ClassValue } from 'clsx'
import { Atoms, atoms } from 'nft/css/atoms'
import { sprinkles } from 'nft/css/sprinkles.css'
import * as React from 'react'
import { animated } from 'react-spring'

type HTMLProperties<T = HTMLElement> = Omit<
  React.AllHTMLAttributes<T>,
  'as' | 'className' | 'color' | 'height' | 'width'
>

type Props = Atoms &
  HTMLProperties & {
    as?: React.ElementType
    className?: ClassValue
  }

/** @deprecated Please use `Flex` from `ui/src` going forward */
export const Box = React.forwardRef<HTMLElement, Props>(({ as = 'div', className, ...props }: Props, ref) => {
  const atomProps: Record<string, unknown> = {}
  const nativeProps: Record<string, unknown> = {}

  for (const key in props) {
    if (sprinkles.properties.has(key as keyof Omit<Atoms, 'reset'>)) {
      atomProps[key] = props[key as keyof typeof props]
    } else {
      nativeProps[key] = props[key as keyof typeof props]
    }
  }

  const atomicClasses = atoms({
    reset: typeof as === 'string' ? (as as Atoms['reset']) : 'div',
    ...atomProps,
  })

  return React.createElement(as, {
    className: clsx(atomicClasses, className),
    ...nativeProps,
    ref,
  })
})

// We get this error around the codebase: https://github.com/microsoft/TypeScript/issues/34933
// so you see ts-ignore almost everywhere this component is used
// since we are going to deprecate vanilla-extract, this will be `any` for now
export const AnimatedBox: any = animated(Box) as any

export type BoxProps = Parameters<typeof Box>[0]

Box.displayName = 'Box'
