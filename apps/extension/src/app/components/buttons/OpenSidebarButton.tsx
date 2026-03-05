import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'

export function OpenSidebarButton({
  openedSideBar,
  handleOpenSidebar,
  handleOpenWebApp,
}: {
  openedSideBar: boolean
  handleOpenSidebar: () => Promise<void>
  handleOpenWebApp: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <Flex row alignSelf="stretch">
      <Button
        icon={openedSideBar ? <ArrowRight /> : undefined}
        iconPosition="after"
        size="large"
        variant={openedSideBar ? 'branded' : 'default'}
        emphasis={openedSideBar ? 'primary' : 'secondary'}
        onPress={openedSideBar ? handleOpenWebApp : handleOpenSidebar}
      >
        {openedSideBar ? t('onboarding.complete.go_to_uniswap') : t('onboarding.complete.button')}
      </Button>
    </Flex>
  )
}
