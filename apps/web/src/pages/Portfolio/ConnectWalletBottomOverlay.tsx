import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'

export function ConnectWalletBottomOverlay(): JSX.Element {
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()

  return (
    <Flex
      $platform-web={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      // this zIndex is `$header` so it's above everything on the page but below the sidebar
      zIndex="$header"
      height="200px"
      width="100%"
      background="linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.9) 60%, rgba(255, 255, 255, 0.6) 90%, rgba(255, 255, 255, 0.0) 100%)"
      justifyContent="center"
      alignItems="center"
      cursor="not-allowed"
    >
      <Flex
        row
        centered
        boxShadow="0 25px 50px -12px rgba(18, 18, 23, 0.25);"
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        p="$spacing16"
        gap="$spacing24"
        cursor="default"
      >
        <Text variant="body2" color="$neutral2">
          {t('portfolio.disconnected.connectWallet.cta')}
        </Text>
        <Button
          variant="branded"
          size="medium"
          width="fit-content"
          maxHeight="48px"
          margin="auto"
          onPress={accountDrawer.open}
        >
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
    </Flex>
  )
}
