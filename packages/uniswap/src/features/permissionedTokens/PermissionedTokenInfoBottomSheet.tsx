import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { openKycExplainer } from 'uniswap/src/features/permissionedTokens/openKycExplainer'
import { PermissionedSheetHeader } from 'uniswap/src/features/permissionedTokens/PermissionedSheetHeader'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

type PermissionedTokenInfoBottomSheetProps = {
  isOpen: boolean
  onClose: () => void
  tokenSymbol: string
}

export function PermissionedTokenInfoBottomSheet({
  isOpen,
  onClose,
  tokenSymbol,
}: PermissionedTokenInfoBottomSheetProps): JSX.Element | null {
  const { t } = useTranslation()

  const handleLearnMore = useCallback(() => openKycExplainer('PermissionedTokenInfoBottomSheet'), [])

  if (!isOpen) {
    return null
  }

  return (
    <Modal name={ModalName.PermissionedTokenInfo} isModalOpen={isOpen} onClose={onClose}>
      <Flex
        gap="$spacing24"
        width="100%"
        pt="$padding16"
        pb="$padding24"
        px="$padding24"
        testID={TestID.PermissionedTokenInfoSheet}
      >
        <PermissionedSheetHeader
          icon={<Lock size="$icon.24" color="$neutral1" />}
          title={t('permissionedPool.banner.heading', { tokenSymbol })}
          description={t('permissionedPool.infoSheet.description')}
          learnMoreLabel={t('permissionedPool.infoSheet.learnMore')}
          onLearnMore={handleLearnMore}
        />
        <Flex row width="100%">
          <Button size="medium" variant="default" emphasis="primary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
