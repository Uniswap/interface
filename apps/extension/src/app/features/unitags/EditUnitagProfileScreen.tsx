import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { backgroundToSidePanelMessageChannel } from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { AnimatePresence, Flex } from 'ui/src'
import { Edit, Ellipsis, Trash } from 'ui/src/components/icons'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
import { MenuContentItem } from 'wallet/src/components/menu/types'
import { ChangeUnitagModal } from 'wallet/src/features/unitags/ChangeUnitagModal'
import { DeleteUnitagModal } from 'wallet/src/features/unitags/DeleteUnitagModal'
import { EditUnitagProfileContent } from 'wallet/src/features/unitags/EditUnitagProfileContent'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

export function EditUnitagProfileScreen({ enableBack = false }: { enableBack?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const address = useAccountAddressFromUrlWithThrow()
  const {
    data: retrievedUnitag,
    isPending,
    isFetching,
  } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const unitag = retrievedUnitag?.username

  useEffect(() => {
    if (!isPending && !isFetching && !unitag) {
      navigate(`/${UnitagClaimRoutes.ClaimIntro}`)
    }
  }, [unitag, isPending, isFetching])

  const { goToPreviousStep } = useOnboardingSteps()

  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)

  const menuOptions = useMemo((): MenuContentItem[] => {
    return [
      {
        label: t('unitags.profile.action.edit'),
        onPress: (): void => setShowChangeUnitagModal(true),
        Icon: Edit,
      },
      {
        label: t('unitags.profile.action.delete'),
        onPress: (): void => setShowDeleteUnitagModal(true),
        Icon: Trash,
        destructive: true,
      },
    ]
  }, [t])

  const refreshUnitags = async (): Promise<void> => {
    await backgroundToSidePanelMessageChannel.sendMessage({
      type: BackgroundToSidePanelRequestType.RefreshUnitags,
    })
  }

  return (
    <Trace logImpression screen={UnitagScreens.EditProfile}>
      <OnboardingScreen
        noTopPadding
        title={t('settings.setting.wallet.action.editProfile')}
        endAdornment={
          <ContextMenu closeOnClick itemId={address} menuOptions={menuOptions} onLeftClick>
            <Flex>
              <Ellipsis color="$neutral2" size="$icon.24" />
            </Flex>
          </ContextMenu>
        }
        onBack={enableBack ? goToPreviousStep : undefined}
      >
        <Flex gap="$spacing12" width="100%" pt="$spacing8">
          {unitag && (
            <>
              <EditUnitagProfileContent address={address} unitag={unitag} entryPoint={UnitagScreens.EditProfile} />
              <AnimatePresence>
                {showDeleteUnitagModal && (
                  <DeleteUnitagModal
                    address={address}
                    unitag={unitag}
                    onSuccess={refreshUnitags}
                    onClose={(): void => setShowDeleteUnitagModal(false)}
                  />
                )}
                {showChangeUnitagModal && (
                  <ChangeUnitagModal
                    address={address}
                    unitag={unitag}
                    onSuccess={refreshUnitags}
                    onClose={(): void => setShowChangeUnitagModal(false)}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
