import { PropsWithChildren, useReducer } from 'react'
import { useTimeout } from 'utilities/src/time/timing'

export enum Delay {
  Short = 500,
  Normal = 2500,
  Long = 5000,
}

type Props = {
  children: JSX.Element
  waitBeforeShow?: Delay
}

/** HOC to delay rendering a component by some time in ms. */
export const Delayed = ({
  children,
  waitBeforeShow = Delay.Short,
}: PropsWithChildren<Props>): JSX.Element | null => {
  const [isShown, setIsShown] = useReducer(() => true, false)

  useTimeout(setIsShown, waitBeforeShow)

  return isShown ? children : null
}
