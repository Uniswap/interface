import { Flex, Text } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { LongText } from 'src/components/text/LongText'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { getTranslatedDescription } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'

/**
 * Token description in the user's language when the backend has a translation, otherwise the
 * original; renders nothing when the project has no description.
 */
export const TokenDetailsAbout = memo(function TokenDetailsAboutInner(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const currentLanguage = useCurrentLanguage()

  const { currencyId, tokenColor } = useTokenDetailsContext()

  const { name, description, descriptionTranslations } = useTokenMetadata(currencyId)
  const currentDescription = getTranslatedDescription(descriptionTranslations, currentLanguage) ?? description

  if (!currentDescription) {
    return null
  }

  return (
    <Flex gap="$spacing4" px="$spacing16">
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
    </Flex>
  )
})
