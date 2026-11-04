import { Button, Flex } from '@universe/mycelium'
import { Key } from '@universe/mycelium/icons/Key'
import { TestID } from '@universe/test'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { Page } from '~/features/wallet/components/GetTheAppModal/constants'
import { ModalContent } from '~/features/wallet/components/GetTheAppModal/Content'
import { PrivyWatermark } from '~/features/wallet/components/Passkey/PrivyWatermark'

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
