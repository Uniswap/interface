import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { OpenSidebarButton } from 'src/app/components/buttons/OpenSidebarButton'
import { useFinishExtensionOnboarding } from 'src/app/features/onboarding/hooks/useFinishExtensionOnboarding'
import { useOpenSidebar } from 'src/app/features/onboarding/hooks/useOpenSidebar'
import { terminateStoreSynchronization } from 'src/store/storeSynchronization'
import { Flex, Text } from 'ui/src'
import { Check, GraduationCap } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function ResetComplete(): JSX.Element {
  const { t } = useTranslation()

  // Activates onboarding accounts on component mount
  useFinishExtensionOnboarding({ callback: terminateStoreSynchronization })

  const { openedSideBar, handleOpenSidebar, handleOpenWebApp } = useOpenSidebar()

  return (
    <>
      <Flex centered gap="$spacing24">
        <Flex backgroundColor="$statusSuccess2" borderRadius="$roundedFull" p="$spacing16">
          <Check color="$statusSuccess" size="$icon.36" />
        </Flex>
        <Flex alignItems="center" gap="$spacing4">
          <Text variant="heading3">{t('onboarding.resetPassword.complete.title')}</Text>
          <Text color="$neutral2" variant="body2">
            {t('onboarding.resetPassword.complete.subtitle')}
          </Text>
        </Flex>
        <OpenSidebarButton
          openedSideBar={openedSideBar}
          handleOpenSidebar={handleOpenSidebar}
          handleOpenWebApp={handleOpenWebApp}
        />
        <Link
          style={{ textDecoration: 'none' }}
          target="_blank"
          to={uniswapUrls.helpArticleUrls.walletSecurityMeasures}
        >
          <Flex row alignItems="center" gap="$spacing8">
            <GraduationCap color="$neutral3" size="$icon.20" />
            <Text color="$neutral3" variant="buttonLabel2">
              {t('onboarding.resetPassword.complete.safety')}
            </Text>
          </Flex>
        </Link>
      </Flex>
    </>
  )
}
