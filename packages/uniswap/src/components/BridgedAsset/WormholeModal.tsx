import { atom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Flex,
  getContrastPassingTextColor,
  ModalCloseIcon,
  Text,
  TouchableArea,
  useColorsFromTokenColor,
  useExtractedTokenColor,
  useSporeColors,
} from 'ui/src'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { iconSizes } from 'ui/src/theme'
import { BaseModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { openUri } from 'uniswap/src/utils/linking'
import { isWebAppDesktop } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export type WormholeModalProps = {
  currencyInfo?: CurrencyInfo
}

export const WormholeModalAtom = atom<WormholeModalProps | undefined>(undefined)

export function WormholeModal({
  currencyInfo,
  isOpen,
  onClose,
}: WormholeModalProps & BaseModalProps): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { tokenColor } = useExtractedTokenColor({
    imageUrl: currencyInfo?.logoUrl,
    tokenName: currencyInfo?.currency.name,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.accent1.val,
  })
  const { validTokenColor } = useColorsFromTokenColor(tokenColor ?? undefined)
  const textColor = useMemo(() => {
    return getContrastPassingTextColor(validTokenColor ?? colors.accent1.val)
  }, [colors.accent1.val, validTokenColor])
  const bridgedWithdrawalInfo = currencyInfo?.bridgedWithdrawalInfo

  const onPressLearnMore = async (): Promise<void> => {
    await openUri({ uri: uniswapUrls.helpArticleUrls.bridgedAssets })
    onClose()
  }

  const onPressContinue = useEvent(async () => {
    if (!bridgedWithdrawalInfo?.url) {
      return
    }
    await openUri({
      uri: bridgedWithdrawalInfo.url,
      openExternalBrowser: true,
    })
    onClose()
  })

  if (!currencyInfo || !currencyInfo.currency.symbol || !bridgedWithdrawalInfo) {
    return null
  }
  const chainName = getChainLabel(currencyInfo.currency.chainId)

  return (
    <Modal
      name={ModalName.Wormhole}
      backgroundColor={colors.surface1.val}
      isDismissible={true}
      isModalOpen={isOpen}
      pt="$spacing16"
      onClose={onClose}
    >
      <Trace logImpression={isOpen} modal={ModalName.Wormhole}>
        <Flex gap="$spacing24" $platform-native={{ p: '$spacing16', pb: '$spacing28' }}>
          <Flex
            row
            fill
            justifyContent="flex-end"
            alignItems="center"
            gap={10}
            display={isWebAppDesktop ? 'flex' : 'none'}
          >
            <Trace logPress element={ElementName.GetHelp}>
              <TouchableArea onPress={onPressLearnMore}>
                <Flex
                  row
                  width="max-content"
                  borderRadius="$rounded16"
                  px="$spacing8"
                  py="$spacing4"
                  backgroundColor="$surface2"
                  gap="$spacing4"
                  alignItems="center"
                  hoverStyle={{ backgroundColor: '$surface2Hovered' }}
                >
                  <EnvelopeHeart size={iconSizes.icon16} color="$neutral1" />
                  <Text variant="body2" color="$neutral2">
                    {t('common.getHelp.button')}
                  </Text>
                </Flex>
              </TouchableArea>
            </Trace>
            <Trace logPress element={ElementName.CloseButton}>
              <ModalCloseIcon onClose={onClose} />
            </Trace>
          </Flex>

          <Flex gap="$spacing16" alignItems="center">
            <Flex row gap="$spacing16" alignItems="center" p="$spacing8">
              <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon36} />
              <Shuffle size={iconSizes.icon24} color="$neutral3" />
              <CurrencyLogo hideNetworkLogo currencyInfo={currencyInfo} size={iconSizes.icon36} />
            </Flex>

            <Flex gap="$spacing8" alignItems="center">
              <Text variant="subheading1" textAlign="center">
                {t('bridgedAsset.wormhole.title', {
                  currencySymbol: currencyInfo.currency.symbol,
                  nativeChainName: bridgedWithdrawalInfo.chain,
                })}
              </Text>
              <Text variant="body2" color="$neutral2" textAlign="center" textWrap="wrap" whiteSpace="wrap">
                {t('bridgedAsset.wormhole.description', {
                  currencySymbol: currencyInfo.currency.symbol,
                  chainName,
                  nativeChainName: bridgedWithdrawalInfo.chain,
                  provider: bridgedWithdrawalInfo.provider,
                })}
              </Text>
              <Trace logPress element={ElementName.LearnMoreLink}>
                <TouchableArea onPress={onPressLearnMore}>
                  <Text variant="body2" color="$neutral1" textAlign="center">
                    {t('common.button.learn')}
                  </Text>
                </TouchableArea>
              </Trace>
            </Flex>
          </Flex>

          <Flex row>
            <Trace logPress element={ElementName.Continue}>
              <Button
                size="medium"
                emphasis="primary"
                backgroundColor={validTokenColor ?? '$accent1'}
                icon={<ExternalLink size={iconSizes.icon20} color={textColor} />}
                iconPosition="after"
                onPress={onPressContinue}
              >
                <Text variant="buttonLabel1" color={textColor}>
                  {t('bridgedAsset.wormhole.button', { provider: bridgedWithdrawalInfo.provider })}
                </Text>
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </Trace>
    </Modal>
  )
}
