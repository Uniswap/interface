import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { UniswapHelpUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { openUri } from 'uniswap/src/utils/linking'

export function EarnLegalDisclaimer(): JSX.Element {
  const onOpenUniswapTerms = useCallback(() => {
    openUri({
      uri: UniswapHelpUrls.articles.uniswapLabsTermsOfService,
      openExternalBrowser: true,
      isSafeUri: true,
    }).catch(() => undefined)
  }, [])

  const onOpenMorphoDisclaimer = useCallback(() => {
    openUri({ uri: UniswapStaticUrls.morphoDisclaimerUrl, openExternalBrowser: true, isSafeUri: true }).catch(
      () => undefined,
    )
  }, [])

  return (
    <Text testID={TestID.EarnLegalDisclaimer} variant="body4" color="$neutral3">
      <Trans
        components={{
          morphoDisclaimerLink: (
            <Text
              variant="body4"
              color="$neutral2"
              fontWeight="$medium"
              cursor="pointer"
              onPress={onOpenMorphoDisclaimer}
            />
          ),
          termsLink: (
            <Text
              variant="body4"
              color="$neutral2"
              fontWeight="$medium"
              cursor="pointer"
              onPress={onOpenUniswapTerms}
            />
          ),
        }}
        i18nKey="explore.earn.vault.details.legalDisclaimer"
      />
    </Text>
  )
}
