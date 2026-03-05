import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'

export function ConfigureAuctionStep() {
  const { t } = useTranslation()
  const { goToNextStep } = useCreateAuctionStoreActions()

  return (
    <Flex gap="$spacing24">
      <Flex>
        <Text variant="heading3" color="$neutral1" paddingBottom="$spacing12">
          {t('toucan.createAuction.step.configureAuction.title')}
        </Text>
        <Separator />
      </Flex>
      <Flex gap="$spacing40">
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.amount')}
        </Text>
        <Text variant="subheading1" color="$neutral1">
          {t('toucan.createAuction.step.configureAuction.clearingPrice')}
        </Text>
        <Flex row>
          <Button size="medium" emphasis="primary" onPress={goToNextStep} fill>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
