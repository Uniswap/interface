import { useCallback, useState } from 'react'
import { AppRoutes, SettingsRoutes, UnitagClaimRoutes } from 'src/app/navigation/constants'
import { focusOrCreateUnitagTab, useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { MonadAnnouncementModal } from 'uniswap/src/components/notifications/MonadAnnouncementModal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEvent } from 'utilities/src/react/hooks'
import { IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function HomeIntroCardStack(): JSX.Element | null {
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const { navigateTo } = useExtensionNavigation()
  const [isMonadModalOpen, setIsMonadModalOpen] = useState(false)

  const navigateToUnitagClaim = useCallback(async () => {
    await focusOrCreateUnitagTab(activeAccount.address, UnitagClaimRoutes.ClaimIntro)
  }, [activeAccount.address])

  const navigateToBackupFlow = useCallback((): void => {
    navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.BackupRecoveryPhrase}`)
  }, [navigateTo])

  const handleMonadExplorePress = useEvent(() => {
    window.open('https://app.uniswap.org/explore/tokens/monad', '_blank')
    setIsMonadModalOpen(false)
  })

  const { cards } = useSharedIntroCards({
    navigateToUnitagClaim,
    navigateToUnitagIntro: navigateToUnitagClaim, // No need to differentiate for extension
    navigateToBackupFlow,
    onMonadAnnouncementPress: () => setIsMonadModalOpen(true),
  })

  // Don't show cards if there are none
  // or if the account is view only (not yet available on extension, adding for safety)
  if (!cards.length || !isSignerAccount) {
    return null
  }

  return (
    <>
      <Flex py="$spacing4">
        <IntroCardStack cards={cards} />
      </Flex>
      {isMonadModalOpen && (
        <MonadAnnouncementModal
          isOpen={isMonadModalOpen}
          onClose={() => setIsMonadModalOpen(false)}
          onExplorePress={handleMonadExplorePress}
        />
      )}
    </>
  )
}
