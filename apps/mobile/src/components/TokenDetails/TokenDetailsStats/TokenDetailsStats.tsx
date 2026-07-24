import { GraphQLApi } from '@universe/api'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { LongText } from 'src/components/text/LongText'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsMarketData } from 'src/components/TokenDetails/TokenDetailsStats/TokenDetailsMarketData'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Language as LanguageIcon } from 'ui/src/components/icons'
import { DEP_accentColors, validColor } from 'ui/src/theme'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { Language } from 'uniswap/src/features/language/constants'
import { useCurrentLanguage, useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// oxlint-disable-next-line complexity
export const TokenDetailsStats = memo(function TokenDetailsStatsInner(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const currentLanguage = useCurrentLanguage()
  const currentLanguageInfo = useCurrentLanguageInfo()

  const [showTranslation, setShowTranslation] = useState(false)

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const onChainData = useTokenBasicInfoPartsFragment({ currencyId }).data
  const offChainData = useTokenBasicProjectPartsFragment({ currencyId }).data.project

  const language = useCurrentLanguage()

  const descriptions = GraphQLApi.useTokenProjectDescriptionQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      includeSpanish:
        language === Language.SpanishSpain ||
        language === Language.SpanishLatam ||
        language === Language.SpanishUnitedStates,
      includeFrench: language === Language.French,
      includeJapanese: language === Language.Japanese,
      includePortuguese: language === Language.Portuguese,
      includeVietnamese: language === Language.Vietnamese,
      includeChineseSimplified: language === Language.ChineseSimplified,
      includeChineseTraditional: language === Language.ChineseTraditional,
    },
    fetchPolicy: 'cache-and-network',
    returnPartialData: true,
  }).data?.token?.project

  const description = descriptions?.description

  const translatedDescription =
    descriptions?.descriptionTranslations?.descriptionEsEs ||
    descriptions?.descriptionTranslations?.descriptionFrFr ||
    descriptions?.descriptionTranslations?.descriptionJaJp ||
    descriptions?.descriptionTranslations?.descriptionPtPt ||
    descriptions?.descriptionTranslations?.descriptionViVn ||
    descriptions?.descriptionTranslations?.descriptionZhHans ||
    descriptions?.descriptionTranslations?.descriptionZhHant

  const metadata = useTokenMetadata(currencyId, { legacyToken: { name: offChainData?.name ?? onChainData.name } })
  const name = metadata.name
  const currentDescription = showTranslation && translatedDescription ? translatedDescription : description

  return (
    <Flex gap="$spacing24">
      {currentDescription && (
        <Flex gap="$spacing4">
          {name && (
            <Text color="$neutral1" testID={TestID.TokenDetailsAboutHeader} variant="subheading2">
              {t('token.stats.section.about', { token: name })}
            </Text>
          )}

          <Flex gap="$spacing16">
            <LongText
              gap="$spacing2"
              color={colors.neutral2.val}
              initialDisplayedLines={5}
              linkColor={tokenColor ?? colors.neutral1.val}
              readMoreOrLessColor={tokenColor ?? colors.neutral2.val}
              text={currentDescription.trim()}
            />
          </Flex>

          {currentLanguage !== Language.English && !!translatedDescription && (
            <TouchableArea onPress={(): void => setShowTranslation(!showTranslation)}>
              <Flex alignItems="center" backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
                {showTranslation ? (
                  <Flex row alignItems="center" gap="$spacing12" width="100%">
                    <Flex fill row alignItems="center" gap="$spacing12">
                      <LanguageIcon color="$neutral2" size="$icon.20" />
                      <Text color="$neutral2" variant="body3">
                        {currentLanguageInfo.displayName}
                      </Text>
                    </Flex>
                    <Text color={validColor(DEP_accentColors.blue400)} variant="buttonLabel2">
                      {t('token.stats.translation.original')}
                    </Text>
                  </Flex>
                ) : (
                  <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
                    <Flex row alignItems="center" gap="$spacing12">
                      <LanguageIcon color="$neutral2" size="$icon.20" />
                      <Text color="$neutral2" variant="body3">
                        {t('token.stats.translation.translate', {
                          language: currentLanguageInfo.displayName,
                        })}
                      </Text>
                    </Flex>
                  </Animated.View>
                )}
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      )}

      <Flex gap="$spacing4">
        <Text color="$neutral2" variant="subheading2">
          {t('token.stats.title')}
        </Text>

        <TokenDetailsMarketData />
      </Flex>
    </Flex>
  )
})
