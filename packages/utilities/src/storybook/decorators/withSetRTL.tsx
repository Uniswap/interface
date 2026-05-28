import { type Decorator } from '@storybook/react'
import { useForceRTL } from 'utilities/src/storybook/hooks/useForceRTL'

export const withSetRTL: (rtl: boolean) => Decorator = (rtl: boolean) =>
  function WithSetRTL(Story): JSX.Element {
    useForceRTL(rtl)

    return <Story />
  }
