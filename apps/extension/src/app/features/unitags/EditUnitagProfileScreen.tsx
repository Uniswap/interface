import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { AnimatePresence, ContextMenu, Flex, MenuContentItem } from 'ui/src'
import { Edit, Ellipsis, Trash } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { ChangeUnitagModal } from 'wallet/src/features/unitags/ChangeUnitagModal'
import { DeleteUnitagModal } from 'wallet/src/features/unitags/DeleteUnitagModal'
import { EditUnitagProfileContent } from 'wallet/src/features/unitags/EditUnitagProfileContent'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function EditUnitagProfileScreen({ enableBack = false }: { enableBack?: boolean }): JSX.Element {
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()
  const { unitag: retrievedUnitag } = useUnitagByAddress(address)
  const unitag = retrievedUnitag?.username

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
  }, [t, setShowChangeUnitagModal, setShowDeleteUnitagModal])

  return (
    <Trace logImpression screen={UnitagScreens.EditProfile}>
      <OnboardingScreen
        noTopPadding
        title={t('settings.setting.wallet.action.editProfile')}
        endAdornment={
          <ContextMenu closeOnClick itemId={address} menuOptions={menuOptions} onLeftClick>
            <Flex>
              <Ellipsis color="$neutral2" size={iconSizes.icon24} />
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
                    onClose={(): void => setShowDeleteUnitagModal(false)}
                  />
                )}
                {showChangeUnitagModal && (
                  <ChangeUnitagModal
                    address={address}
                    unitag={unitag}
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
