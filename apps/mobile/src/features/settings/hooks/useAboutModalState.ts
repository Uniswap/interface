import { useNavigation } from '@react-navigation/core'
import { useTranslation } from 'react-i18next'
import type { SettingsStackNavigationProp } from 'src/app/navigation/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import type { AboutModalState } from 'wallet/src/components/settings/about/AboutModal'

/**
 * Hook that builds the navigation handlers consumed by AboutModal on mobile.
 * Privacy Policy and Terms of Service open in the in-app WebView (matching the
 * pre-existing pattern); Disclosures pushes the dedicated Settings screen.
 */
export function useAboutModalState(): AboutModalState {
  const navigation = useNavigation<SettingsStackNavigationProp>()
  const { t } = useTranslation()

  const onPressPrivacyPolicy = useEvent((): void => {
    navigation.navigate(MobileScreens.WebView, {
      uriLink: uniswapUrls.privacyPolicyUrl,
      headerTitle: t('settings.action.privacy'),
    })
  })

  const onPressTermsOfService = useEvent((): void => {
    navigation.navigate(MobileScreens.WebView, {
      uriLink: uniswapUrls.termsOfServiceUrl,
      headerTitle: t('settings.action.terms'),
    })
  })

  const onPressDisclosures = useEvent((): void => {
    navigation.navigate(MobileScreens.SettingsDisclosures)
  })

  return {
    onPressPrivacyPolicy,
    onPressTermsOfService,
    onPressDisclosures,
  }
}
