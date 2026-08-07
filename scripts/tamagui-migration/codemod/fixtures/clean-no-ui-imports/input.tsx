import { ComponentProps } from 'react'

export function Passthrough(props: ComponentProps<'div'>): JSX.Element {
  return <div {...props} />
}
