import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Clear } from 'ui/src/components/icons/Clear'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { fonts } from 'ui/src/theme'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useXOAuthFlow } from '~/pages/Liquidity/CreateAuction/hooks/useXOAuthFlow'
import {
  isAllowedWebsiteLinkInput,
  isValidWebsiteLink,
  normalizeWebsiteLink,
} from '~/pages/Liquidity/CreateAuction/utils'

export function TokenAdditionalInfoSection({
  description,
  onDescriptionChange,
  websiteLink,
  onWebsiteLinkChange,
}: {
  description: string
  onDescriptionChange: (v: string) => void
  websiteLink: string
  onWebsiteLinkChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const xVerification = useCreateAuctionStore((state) => state.xVerification)
  const { setXVerification } = useCreateAuctionStoreActions()
  const { connectX, isLoading, error } = useXOAuthFlow()
  const [websiteLinkTouched, setWebsiteLinkTouched] = useState(false)
  const disconnectX = useCallback(() => setXVerification(undefined), [setXVerification])
  const clearWebsiteLink = useCallback(() => onWebsiteLinkChange(''), [onWebsiteLinkChange])

  useEffect(() => {
    if (websiteLink === '') {
      setWebsiteLinkTouched(false)
    }
  }, [websiteLink])

  const handleWebsiteLinkChange = useCallback(
    (value: string) => {
      if (!isAllowedWebsiteLinkInput(value)) {
        return
      }
      onWebsiteLinkChange(value)
    },
    [onWebsiteLinkChange],
  )

  const handleWebsiteLinkBlur = useCallback(() => {
    setWebsiteLinkTouched(true)
    const trimmed = websiteLink.trim()
    if (!trimmed || !isAllowedWebsiteLinkInput(trimmed)) {
      return
    }
    const normalized = normalizeWebsiteLink(trimmed)
    if (normalized !== websiteLink) {
      onWebsiteLinkChange(normalized)
    }
  }, [onWebsiteLinkChange, websiteLink])

  const websiteLinkHasError = websiteLinkTouched && websiteLink !== '' && !isValidWebsiteLink(websiteLink)

  return (
    <Flex gap="$spacing8">
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2" minHeight={120}>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.descriptionField')}
        </Text>
        <Input
          flex={1}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t('toucan.createAuction.step.tokenInfo.descriptionPlaceholder')}
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
      </Flex>
      <Flex gap="$spacing4">
        <Flex
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor={websiteLinkHasError ? '$statusCritical' : '$surface2'}
          borderRadius="$rounded20"
          p="$spacing16"
          gap="$spacing12"
        >
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="body3" color="$neutral2">
              {t('toucan.createAuction.step.tokenInfo.websiteLink')}
            </Text>
            <QuestionInCircleFilled color="$neutral2" size="$icon.16" />
          </Flex>
          <Flex row alignItems="center" gap="$spacing8">
            <Input
              flex={1}
              value={websiteLink}
              onChangeText={handleWebsiteLinkChange}
              onBlur={handleWebsiteLinkBlur}
              placeholder={t('toucan.createAuction.step.tokenInfo.websiteLinkPlaceholder')}
              unstyled
              outlineStyle="none"
              fontFamily="$body"
              fontSize={fonts.body1.fontSize}
              lineHeight={fonts.body1.lineHeight}
              fontWeight={fonts.body1.fontWeight}
              color="$neutral1"
              placeholderTextColor="$neutral3"
            />
            {websiteLink ? (
              <TouchableArea onPress={clearWebsiteLink}>
                <Clear color="$neutral2" size="$icon.20" />
              </TouchableArea>
            ) : null}
          </Flex>
        </Flex>
        {websiteLinkHasError ? (
          <Text variant="body4" color="$statusCritical" textAlign="center">
            {t('toucan.createAuction.step.tokenInfo.websiteLink.error')}
          </Text>
        ) : null}
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
