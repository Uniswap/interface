import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { fonts } from 'ui/src/theme'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getAuctionVerifyCompletedProperties } from '~/pages/Liquidity/CreateAuction/analytics'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useXOAuthFlow } from '~/pages/Liquidity/CreateAuction/hooks/useXOAuthFlow'
import { MAX_TOKEN_DESCRIPTION_LENGTH } from '~/pages/Liquidity/CreateAuction/types'

export function TokenAdditionalInfoSection({
  description,
  onDescriptionChange,
}: {
  description: string
  onDescriptionChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const trace = useTrace()
  const xVerification = useCreateAuctionStore((state) => state.xVerification)
  const { setXVerification } = useCreateAuctionStoreActions()
  const onVerified = useEvent(() => {
    sendAnalyticsEvent(
      AuctionEventName.AuctionVerifyCompleted,
      getAuctionVerifyCompletedProperties({ trace, verifyType: 'twitter' }),
    )
  })
  const { connectX, isLoading, error } = useXOAuthFlow({ onVerified })
  const disconnectX = useCallback(() => setXVerification(undefined), [setXVerification])

  return (
    <Flex gap="$spacing8">
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2" minHeight={120}>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.descriptionField')}
        </Text>
        <Trace logFocus element={ElementName.AuctionTokenDescription}>
          <Input
            flex={1}
            value={description}
            onChangeText={onDescriptionChange}
            placeholder={t('toucan.createAuction.step.tokenInfo.descriptionPlaceholder')}
            maxLength={MAX_TOKEN_DESCRIPTION_LENGTH}
            multiline
            numberOfLines={3}
            unstyled
            outlineStyle="none"
            fontFamily="$body"
            fontSize={fonts.body1.fontSize}
            lineHeight={fonts.body1.lineHeight}
            fontWeight={fonts.body1.fontWeight}
            color="$neutral1"
            placeholderTextColor="$neutral3"
          />
        </Trace>
      </Flex>
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing12">
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.tokenInfo.xProfile')}
          </Text>
          <Text variant="body3" color="$neutral3">
            {t('toucan.createAuction.step.tokenInfo.optional')}
          </Text>
          <QuestionInCircleFilled color="$neutral2" size="$icon.16" />
        </Flex>
        {xVerification ? (
          <Flex gap="$spacing8">
            <Flex row alignItems="center" gap="$spacing8" flex={1} minWidth={0}>
              <Text variant="body1" color="$neutral1" numberOfLines={1} flex={1}>
                @{xVerification.xHandle}
              </Text>
              <Check color="$accent1" size="$icon.24" />
            </Flex>
            <TouchableArea onPress={disconnectX} alignSelf="flex-start">
              <Text variant="body3" color="$neutral2">
                {t('toucan.createAuction.step.tokenInfo.xProfile.disconnect')}
              </Text>
            </TouchableArea>
          </Flex>
        ) : (
          <Trace logPress element={ElementName.XProfileConnect}>
            <TouchableArea
              row
              alignItems="center"
              justifyContent="center"
              backgroundColor="$surface3"
              borderRadius="$rounded16"
              py="$spacing12"
              px="$spacing16"
              gap="$spacing8"
              disabled={isLoading}
              onPress={connectX}
              opacity={isLoading ? 0.6 : 1}
            >
              <XTwitter color="$neutral1" size="$icon.24" />
              <Text variant="buttonLabel2" color="$neutral1">
                {isLoading
                  ? t('toucan.createAuction.step.tokenInfo.xProfile.connecting')
                  : t('toucan.createAuction.step.tokenInfo.xProfile.connect')}
              </Text>
              <ExternalLink color="$neutral1" size="$icon.20" />
            </TouchableArea>
          </Trace>
        )}
        {error && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {t('toucan.createAuction.step.tokenInfo.xProfile.error')}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
