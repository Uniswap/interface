import clsx, { ClassValue } from 'clsx'
import * as React from 'react'

import { Atoms, atoms } from '../css/atoms'
import { sprinkles } from '../css/sprinkles.css'

type HTMLProperties<T = HTMLElement> = Omit<
  React.AllHTMLAttributes<T>,
  'as' | 'className' | 'color' | 'height' | 'width'
>

type Props = Atoms &
  HTMLProperties & {
    as?: React.ElementType
    className?: ClassValue
  }

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

export type BoxProps = Parameters<typeof Box>[0]

Box.displayName = 'Box'
