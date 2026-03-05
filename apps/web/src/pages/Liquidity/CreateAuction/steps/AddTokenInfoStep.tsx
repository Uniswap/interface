import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'

export function AddTokenInfoStep() {
  const { t } = useTranslation()
  const { goToNextStep } = useCreateAuctionStoreActions()

  return (
    <Flex gap="$spacing24">
      <Flex>
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.tokenInfo.title')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.description')}
        </Text>
      </Flex>
      <Flex row>
        <Button size="medium" emphasis="primary" onPress={goToNextStep} fill>
          {t('common.button.continue')}
        </Button>
      </Flex>
    </Flex>
  )
}
