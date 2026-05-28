import { PropsWithChildren } from 'react'

export const Jiggly = (
  _: PropsWithChildren<{
    offset?: number
    duration?: number
  }>,
): JSX.Element => {
  throw new Error('Implemented in `.native.tsx` and `.web.tsx` files')
}
