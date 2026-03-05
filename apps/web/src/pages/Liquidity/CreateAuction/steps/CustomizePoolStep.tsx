import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'

export function CustomizePoolStep() {
  const { t } = useTranslation()
  const { goToNextStep } = useCreateAuctionStoreActions()

  return (
    <Flex gap="$spacing20">
      <Flex>
        <Text variant="heading3" color="$neutral1" paddingBottom="$spacing12">
          {t('toucan.createAuction.step.customizePool.title')}
        </Text>
        <Separator />
      </Flex>
      <Flex row>
        <Button size="medium" emphasis="primary" onPress={goToNextStep} fill>
          {t('toucan.createAuction.reviewLaunch')}
        </Button>
      </Flex>
    </Flex>
  )
}
