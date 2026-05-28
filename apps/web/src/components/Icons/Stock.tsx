import { ComponentProps } from 'react'

export function StockIcon(props: ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1024 1024" {...props}>
      <path
        d="M128 640h128v256H128v-256z m213.333333-128h128v384H341.333333v-384z m213.333334 85.333333h128v298.666667h-128v-298.666667z m213.333333-128h128v426.666667h-128V469.333333z m-128-341.333333l97.706667 97.706667-165.546667 165.504L401.450667 220.586667 128 494.464 188.16 554.666667l213.290667-213.376L572.16 512l226.133333-225.706667 97.664 97.664V128H640z"
        fill={props.fill}
      />
    </svg>
  )
}
