import React from 'react'
import { Button } from 'ui/src'

type ButtonProps = React.ComponentProps<typeof Button>
export const GatingButton = (props: Omit<ButtonProps, 'size' | 'emphasis'>): JSX.Element => {
  return <Button size="small" emphasis="secondary" {...props} />
}
