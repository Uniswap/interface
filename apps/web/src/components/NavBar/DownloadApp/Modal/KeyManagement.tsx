import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { Key } from 'ui/src/components/icons/Key'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { Page } from '~/components/NavBar/DownloadApp/Modal/constants'
import { ModalContent } from '~/components/NavBar/DownloadApp/Modal/Content'
import { PrivyWatermark } from '~/components/Passkey/PrivyWatermark'

export function KeyManagementModal({
  setPage,
  onClose,
  goBack,
}: {
  setPage: Dispatch<SetStateAction<Page>>
  onClose: () => void
  goBack: () => void
}) {
  const { t } = useTranslation()

  return (
    <Trace logImpression modal={ModalName.KeyManagement}>
      <ModalContent
        title={t('onboarding.keyManagement.title')}
        subtext={t('onboarding.keyManagement.description')}
        header={
          <Flex p="$padding12" backgroundColor="$surface3" borderRadius="$rounded12">
            <Key color="$neutral1" size="$icon.24" />
          </Flex>
        }
        onClose={onClose}
        goBack={goBack}
        footer={<PrivyWatermark pt="$spacing24" />}
      >
        <Flex width="100%">
          <Flex row alignSelf="stretch">
            <Button
              testID={TestID.Continue}
              variant="branded"
              size="large"
              onPress={() => setPage(Page.PasskeyGeneration)}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
