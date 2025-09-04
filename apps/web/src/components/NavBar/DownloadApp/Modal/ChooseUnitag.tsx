import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ClaimUnitagContent } from 'uniswap/src/features/unitags/ClaimUnitagContent'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

export function ChooseUnitagModal({
  setUnitag,
  setPage,
  onClose,
  goBack,
}: {
  setUnitag: Dispatch<SetStateAction<string>>
  setPage: Dispatch<SetStateAction<Page>>
  onClose: () => void
  goBack: () => void
}) {
  const { t } = useTranslation()

  const onContinue = useCallback(
    (unitag: string) => {
      setUnitag(unitag)
      setPage(Page.PasskeyGeneration)
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
        <Flex px="$spacing32" width="100%" pb="$spacing32">
          <ClaimUnitagContent animateY={false} entryPoint={ExtensionScreens.Home} onComplete={onContinue} />
        </Flex>
      </ModalContent>
    </Trace>
  )
}
