/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { useAccount } from 'hooks/useAccount'
import { useScroll } from 'hooks/useScroll'
import { useEffect, useState } from 'react'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'

export default function ConnectedAddressDisplay() {
  const { height: scrollHeight } = useScroll()
  const [isCompact, setIsCompact] = useState(false)
  // Use connected address rather than usePortfolioAddress because this is only for the connected view
  const account = useAccount()

  useEffect(() => {
    setIsCompact((prevIsCompact) => {
      if (!prevIsCompact && scrollHeight > 120) {
        return true
      }
      if (prevIsCompact && scrollHeight < 80) {
        return false
      }
      return prevIsCompact
    })
  }, [scrollHeight])

  if (!account.address) {
    return null
  }

  return (
    <AddressDisplay
      size={isCompact ? 24 : 48}
      showCopy
      address={account.address}
      hideAddressInSubtitle={isCompact}
      addressNumVisibleCharacters={4}
      accountIconTransition="all 0.3s ease"
    />
  )
}
