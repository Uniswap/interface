/**
 * Platform-split base leg; restates the web leg's type for platformless consumers.
 */
import { PlatformSplitStubError } from '@universe/environment'
import * as React from 'react'
import type { DropdownMenuSheetItemCompatProps } from './types'

type RootDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, keyof DropdownMenuSheetItemCompatProps>

export const DropdownMenuSheetItemCompat: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<DropdownMenuSheetItemCompatProps & RootDivProps> & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, DropdownMenuSheetItemCompatProps & RootDivProps>(
  function DropdownMenuSheetItemCompat(): React.JSX.Element {
    throw new PlatformSplitStubError('DropdownMenuSheetItemCompat')
  },
)

DropdownMenuSheetItemCompat.displayName = 'DropdownMenuSheetItemCompat'
