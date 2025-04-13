import { useCallback } from 'react'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { focusOrCreateUnitagTab } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function HomeIntroCardStack(): JSX.Element | null {
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  const navigateToUnitagClaim = useCallback(async () => {
    await focusOrCreateUnitagTab(activeAccount.address, UnitagClaimRoutes.ClaimIntro)
  }, [activeAccount.address])

  const { cards } = useSharedIntroCards({
    navigateToUnitagClaim,
    navigateToUnitagIntro: navigateToUnitagClaim, // No need to differentiate for extension
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
