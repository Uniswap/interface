import { InterfaceElementName } from '@uniswap/analytics-events'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { Wiggle } from 'pages/Landing/components/animations'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, FlexProps, Image, Text, TextProps, TouchableArea } from 'ui/src'
import { CHROME_LOGO } from 'ui/src/assets'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { isMobileWeb, isWebAndroid, isWebIOS } from 'utilities/src/platform'

export function DownloadWalletRow({
  onPress,
  titleTextVariant = 'buttonLabel3',
  iconSize = 20,
  ...rest
}: {
  onPress: () => void
  titleTextVariant?: TextProps['variant']
  iconSize?: number
} & FlexProps) {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Flex
        row
        justifyContent="center"
        alignItems="center"
        gap="$gap8"
        backgroundColor="$accent2"
        p="$spacing12"
        {...rest}
        $md={{ borderRadius: '$rounded20', mt: 0, p: '$spacing16', ...rest.$md }}
      >
        <Text variant={titleTextVariant} color="$accent1" mr="auto" $md={{ variant: 'buttonLabel3' }}>
          {isMobileWeb ? t('common.getUniswapWallet.mobile') : t('common.getUniswapWallet')}
        </Text>
        <Trace logPress element={InterfaceElementName.EXTENSION_DOWNLOAD_BUTTON}>
          <Anchor
            href={uniswapUrls.chromeExtension}
            target="_blank"
            rel="noreferrer"
            height={iconSize}
            $md={{ display: 'none' }}
            onPress={(e) => e.stopPropagation()}
          >
            <Wiggle>
              <Image height={iconSize} source={CHROME_LOGO} width={iconSize} />
            </Wiggle>
          </Anchor>
        </Trace>
        {(isWebIOS || !isMobileWeb) && (
          <Trace logPress element={InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON}>
            <Anchor
              href={uniswapUrls.appStoreDownloadUrl}
              target="_blank"
              rel="noreferrer"
              height={iconSize}
              onPress={(e) => e.stopPropagation()}
            >
              <Wiggle>
                <AppStoreLogo size={iconSize} />
              </Wiggle>
            </Anchor>
          </Trace>
        )}
        {(isWebAndroid || !isMobileWeb) && (
          <Trace logPress element={InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON}>
            <Anchor
              href={uniswapUrls.playStoreDownloadUrl}
              target="_blank"
              rel="noreferrer"
              height={iconSize}
              onPress={(e) => e.stopPropagation()}
            >
              <Wiggle>
                <Flex backgroundColor="black" p="$spacing2" borderRadius="$rounded4">
                  <GooglePlayStoreLogo height={iconSize - 4} width={iconSize - 4} />
                </Flex>
              </Wiggle>
            </Anchor>
          </Trace>
        )}
        <RightArrow size={iconSize} color="$neutral1" />
      </Flex>
    </TouchableArea>
  )
}
