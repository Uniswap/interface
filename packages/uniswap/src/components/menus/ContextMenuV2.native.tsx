import { Fragment, PropsWithChildren } from 'react'
import { ContextMenuProps } from 'uniswap/src/components/menus/ContextMenuV2'

export function ContextMenu(props: PropsWithChildren<ContextMenuProps>): JSX.Element {
  return <Fragment>{props.children}</Fragment>
}
