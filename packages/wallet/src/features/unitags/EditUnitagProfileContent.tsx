import { isExtensionApp, isIOS } from '@universe/environment'
import type { ComponentType, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { KeyboardAwareScrollView } from 'wallet/src/components/scrollView/KeyboardAwareScrollView'
import { UnitagProfileForm } from 'wallet/src/features/unitags/components/UnitagProfileForm'
import { UnitagProfileHeader } from 'wallet/src/features/unitags/components/UnitagProfileHeader'
import {
  type EditUnitagProfileEntryPoint,
  useEditUnitagProfileState,
} from 'wallet/src/features/unitags/hooks/useEditUnitagProfileState'

export function EditUnitagProfileContent({
  address,
  unitag,
  entryPoint,
  onNavigate,
  onSave,
}: {
  address: string
  unitag: string
  entryPoint: EditUnitagProfileEntryPoint
  onNavigate?: () => void
  onSave?: () => void
  SaveButtonWrapper?: ComponentType<PropsWithChildren>
}): JSX.Element {
  const { t } = useTranslation()
  const {
    loading,
    unitagMetadata,
    isSaving,
    bioInput,
    twitterInput,
    avatarImageUri,
    setBioInput,
    setAvatarImageUri,
    setTwitterInput,
    profileMetadataEdited,
    onPressSaveChanges,
  } = useEditUnitagProfileState({
    address,
    unitag,
    entryPoint,
    onNavigate,
    onSave,
  })

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: isExtensionApp ? 0 : spacing.spacing24,
        }}
        bottomExtraOffset={spacing.spacing24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        stickyComponentKeyboardOpenedOffset={isIOS ? spacing.spacing12 : spacing.spacing24}
        stickyComponent={
          <Button
            loading={isSaving}
            disabled={!profileMetadataEdited}
            mt="$spacing12"
            mx={isExtensionApp ? undefined : '$spacing24'}
            size="large"
            variant="branded"
            fill={false}
            onPress={onPressSaveChanges}
          >
            {t('common.button.save')}
          </Button>
        }
      >
        <Flex justifyContent="flex-start">
          <UnitagProfileHeader
            address={address}
            unitag={unitag}
            avatarImageUri={avatarImageUri}
            originalAvatarUri={unitagMetadata?.avatar}
            setAvatarImageUri={setAvatarImageUri}
          />

          <UnitagProfileForm
            address={address}
            loading={loading}
            bioInput={bioInput}
            twitterInput={twitterInput}
            onBioChange={setBioInput}
            onTwitterChange={setTwitterInput}
          />
        </Flex>
      </KeyboardAwareScrollView>
    </>
  )
}
