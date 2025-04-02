import { Page } from 'components/NavBar/DownloadApp/Modal'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { ClaimUnitagContent } from 'uniswap/src/features/unitags/ClaimUnitagContent'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'

export function ChooseUnitagModal({ setPage }: { setPage: Dispatch<SetStateAction<Page>> }) {
  const { t } = useTranslation()

  const onContinue = useCallback(() => {
    setPage(Page.PasskeyGeneration)
  }, [setPage])

  return (
    <ModalContent
      title={t('onboarding.name.choose')}
      subtext={t('onboarding.name.choose.subtitle')}
      logo={
        <Flex p="$padding12" backgroundColor="$surface2" borderRadius="$rounded12">
          <Person color="$neutral1" size="$icon.20" />
        </Flex>
      }
    >
      {/* TODO(xtine): fix animations and update styling. */}
      <ClaimUnitagContent animateY={false} entryPoint={ExtensionScreens.Home} onComplete={onContinue} />
    </ModalContent>
  )
}
