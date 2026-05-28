import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function ActionCanNotBeCompletedContent(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Trace logImpression eventOnTrigger={WalletEventName.MismatchAccountSignatureRequestBlocked}>
      <DappRequestContent title={t('dapp.request.actionCannotBeCompleted.header')}>
        <Flex
          backgroundColor="$statusCritical2"
          borderRadius="$rounded16"
          flexDirection="column"
          gap="$spacing12"
          p="$spacing16"
          position="relative"
          width="100%"
        >
          <Flex flexDirection="row" gap="$gap12">
            <Flex>
              <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
            </Flex>
            <Flex gap="$spacing8" flexShrink={1}>
              <Text color="$statusCritical" variant="buttonLabel3">
                {t('dapp.request.actionCannotBeCompleted.title')}
              </Text>
              <Text color="$neutral2" variant="body4">
                {t('dapp.request.actionCannotBeCompleted.description')}
              </Text>
              <LearnMoreLink
                textVariant="buttonLabel4"
                url={uniswapUrls.helpArticleUrls.mismatchedImports}
                textColor="$neutral1"
              />
            </Flex>
          </Flex>
        </Flex>
      </DappRequestContent>
    </Trace>
  )
}
