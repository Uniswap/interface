import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'

export function ReviewLaunchStep() {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing12">
      <Flex gap="$spacing32">
        <Flex>
          <Text variant="heading3" color="$neutral1" paddingBottom="$spacing12">
            {t('toucan.createAuction.step.tokenInfo.title')}
          </Text>
          <Separator />
        </Flex>
        <Flex>
          <Text variant="heading3" color="$neutral1" paddingBottom="$spacing12">
            {t('toucan.createAuction.step.configureAuction.title')}
          </Text>
          <Separator />
        </Flex>
        <Flex>
          <Text variant="heading3" color="$neutral1" paddingBottom="$spacing12">
            {t('toucan.createAuction.step.customizePool.title')}
          </Text>
          <Separator />
        </Flex>
      </Flex>
      <Flex row>
        <Button size="medium" emphasis="primary" onPress={() => {}} fill isDisabled={true}>
          {t('toucan.createAuction.launchAuction')}
        </Button>
      </Flex>
    </Flex>
  )
}
