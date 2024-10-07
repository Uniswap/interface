import { useCallback } from 'react'
import { focusOrCreateUnitagClaimTab } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function HomeIntroCardStack(): JSX.Element | null {
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const { data } = usePortfolioTotalValue({
    address: activeAccount.address,
    // Not needed often given usage, and will get updated from other sources
    pollInterval: PollingInterval.Slow,
  })

  const navigateToUnitagClaim = useCallback(async () => {
    await focusOrCreateUnitagClaimTab()
  }, [])

  const { cards } = useSharedIntroCards({
    navigateToUnitagClaim,
    navigateToUnitagIntro: navigateToUnitagClaim, // No need to differentiate for extension
    hasTokens: (data?.balanceUSD ?? 0) > 0,
  })

  // Don't show cards if there are none
  // or if the account is view only (not yet available on extension, adding for safety)
  if (!cards.length || !isSignerAccount) {
    return null
  }

  return (
    <Flex py="$spacing4">
      <IntroCardStack cards={cards} />
    </Flex>
  )
}
