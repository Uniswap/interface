import { useEffect, useState } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const exampleDisconnectedNotification = {
  type: 2,
  // address: '0x...',
  dappName: 'Uniswap Interface',
  event: 1,
  imageUrl: 'https://app.uniswap.org/favicon.png',
  hideDelay: 3000,
}

export const exampleSwapConfirmation = {
  type: 7,
  chainId: 42161,
  hideDelay: 2000,
}

export const exampleSwapSuccess = {
  txStatus: 'failed',
  chainId: 42161,
  txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  // address: '0x...',
  // txId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  type: 3,
  txType: 'swap',
  inputCurrencyId: '42161-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  outputCurrencyId: '42161-0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
  inputCurrencyAmountRaw: '10000000000000000',
  outputCurrencyAmountRaw: '1356219232855702996',
  tradeType: 0,
  hideDelay: 3000,
}

// easiest to use inside NotificationToastWrapper before any returns
export const useMockNotification = (ms?: number): void => {
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
          ...exampleSwapSuccess,
          hideDelay: ms ?? exampleSwapSuccess.hideDelay,
          address: activeAddress,
        })
      )
      setSent(true)
    }
  }, [activeAddress, dispatch, ms, sent])
}

const generateRandomId = (): string => {
  let randomId = '0x'
  for (let i = 0; i < 40; i++) {
    randomId += Math.floor(Math.random() * 16).toString(16)
  }
  return randomId
}

const generateRandomDate = (): number => {
  const start = new Date(2023, 4, 12)
  const end = new Date()
  return Math.floor(
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).getTime() / 1000
  )
}

export const useMockCloudBackups = (numberOfBackups?: number): CloudStorageMnemonicBackup[] => {
  const number = numberOfBackups ?? 1

  const mockBackups = Array.from({ length: number }, () => ({
    mnemonicId: generateRandomId(),
    createdAt: generateRandomDate(),
  }))

  return mockBackups
}
