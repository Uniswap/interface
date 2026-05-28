import { ComponentProps } from 'react'

export function Wrap(props: ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
      <circle cx="12.5" cy="12" r="8.5" stroke={props.fill || '#9B9B9B'} strokeWidth="1.5" fill="none" />
      <circle cx="12.5" cy="12" r="3.5" fill={props.fill || '#9B9B9B'} />
    </svg>
  )
}
