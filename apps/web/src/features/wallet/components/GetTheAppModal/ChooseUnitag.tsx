import { Flex, Text } from '@universe/mycelium'
import { Person } from '@universe/mycelium/icons/Person'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ClaimUnitagContent } from 'uniswap/src/features/unitags/ClaimUnitagContent'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { Page } from '~/features/wallet/components/GetTheAppModal/constants'
import { ModalContent } from '~/features/wallet/components/GetTheAppModal/Content'

export function ChooseUnitagModal({
  setUnitag,
  setPage,
  onClose,
  goBack,
}: {
  setUnitag: Dispatch<SetStateAction<string>>
  setPage: Dispatch<SetStateAction<Page>>
  onClose: () => void
  goBack?: () => void
}) {
  const { t } = useTranslation()

  const onContinue = useCallback(
    (unitag: string) => {
      setUnitag(unitag)
      setPage(Page.KeyManagement)
    },
    [setPage, setUnitag],
  )

  return (
    <Trace logImpression modal={ModalName.ChooseUnitag}>
      <ModalContent
        title={t('onboarding.name.choose')}
        subtext={
          <Flex mx="$spacing32">
            <Text variant="body2" color="$neutral2" textAlign="center">
              {t('onboarding.name.choose.subtitle')}
            </Text>
          </Flex>
        }
        header={
          <Flex p="$padding12" backgroundColor="$surface2" borderRadius="$rounded12">
            <Person color="$neutral1" size="$icon.24" />
          </Flex>
        }
        onClose={onClose}
        goBack={goBack}
      >
        <Flex width="100%">
          <ClaimUnitagContent animateY={false} entryPoint={ExtensionScreens.Home} onComplete={onContinue} />
        </Flex>
      </ModalContent>
    </Trace>
  )
}
