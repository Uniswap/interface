import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { fonts } from 'ui/src/theme'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useActiveAddress } from '~/features/accounts/store/hooks'
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
  const activeAddress = useActiveAddress(Platform.EVM)
  const xVerification = useCreateAuctionStore((state) => state.xVerification)
  const { setXVerification } = useCreateAuctionStoreActions()
  const [walletChangedNotice, setWalletChangedNotice] = useState(false)
  const onVerified = useEvent(() => {
    setWalletChangedNotice(false)
    sendAnalyticsEvent(
      AuctionEventName.AuctionVerifyCompleted,
      getAuctionVerifyCompletedProperties({ trace, verifyType: 'twitter' }),
    )
  })
  const { connectX, isLoading, error } = useXOAuthFlow({ onVerified })
  const disconnectX = useCallback(() => {
    setWalletChangedNotice(false)
    setXVerification(undefined)
  }, [setXVerification])

  // The X token is bound to the wallet that initiated the OAuth flow; the backend rejects it when
  // submitted from a different wallet. If the active wallet switches, clear the verification so the user
  // re-verifies with the new wallet — and the stale token can never reach the submit path.
  const boundWalletAddress = xVerification?.boundWalletAddress
  useEffect(() => {
    if (!boundWalletAddress || !activeAddress) {
      return
    }
    const stillBound = areAddressesEqual({
      addressInput1: { address: boundWalletAddress, platform: Platform.EVM },
      addressInput2: { address: activeAddress, platform: Platform.EVM },
    })
    if (!stillBound) {
      setXVerification(undefined)
      setWalletChangedNotice(true)
    }
  }, [boundWalletAddress, activeAddress, setXVerification])

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
          <Flex gap="$spacing8">
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
            {walletChangedNotice && (
              <Text variant="body3" color="$neutral2" textAlign="center">
                {t('toucan.createAuction.step.tokenInfo.xProfile.walletChanged')}
              </Text>
            )}
          </Flex>
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
