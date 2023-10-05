import { useEffect, useState } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const fakeNotification = {
  type: 2,
  // address: '0x...',
  dappName: 'Uniswap Interface',
  event: 1,
  imageUrl: 'https://app.uniswap.org/favicon.png',
  hideDelay: 3000,
}

// easiest to use inside NotificationToastWrapper before any returns
export const useFakeNotification = (ms?: number): void => {
  const [sent, setSent] = useState(false)
  const dispatch = useAppDispatch()
  const activeAddress = useActiveAccountAddressWithThrow()

  useEffect(() => {
    setSent(false)
  }, [ms])

  useEffect(() => {
    if (!sent && activeAddress) {
      dispatch(
        pushNotification({
          ...fakeNotification,
          hideDelay: ms ?? fakeNotification.hideDelay,
          address: activeAddress,
        })
      )
      setSent(true)
    }
  }, [activeAddress, dispatch, ms, sent])
}
