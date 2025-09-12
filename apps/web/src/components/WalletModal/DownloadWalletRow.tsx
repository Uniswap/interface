import { Wiggle } from 'components/animations/Wiggle'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, FlexProps, Text, TextProps, TouchableArea } from 'ui/src'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
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
        <Trace logPress element={ElementName.ExtensionDownloadButton}>
          <Anchor
            href={uniswapUrls.chromeExtension}
            target="_blank"
            rel="noreferrer"
            height={iconSize}
            $md={{ display: 'none' }}
            onPress={(e) => e.stopPropagation()}
          >
            <Wiggle>
              <GoogleChromeLogo size={iconSize} />
            </Wiggle>
          </Anchor>
        </Trace>
        {(isWebIOS || !isMobileWeb) && (
          <Trace logPress element={ElementName.UniswapWalletModalDownloadButton}>
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
          <Trace logPress element={ElementName.UniswapWalletModalDownloadButton}>
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
