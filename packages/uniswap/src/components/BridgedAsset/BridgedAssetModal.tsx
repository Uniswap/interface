import { atom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
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
import { ArrowUpCircle } from 'ui/src/components/icons/ArrowUpCircle'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { Verified } from 'ui/src/components/icons/Verified'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useDismissedBridgedAssetWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { openUri } from 'uniswap/src/utils/linking'
import { isWebAppDesktop } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export type BridgedAssetModalProps = {
  currencyInfo0?: CurrencyInfo
  currencyInfo1?: CurrencyInfo
  onContinue?: () => void
  modalName?: ModalNameType
}

export type BaseModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const BridgedAssetModalAtom = atom<BridgedAssetModalProps | undefined>(undefined)

function BridgedAssetModalContent({ currencyInfo }: { currencyInfo: CurrencyInfo }): JSX.Element | null {
  const { t } = useTranslation()
  const chainName = getChainLabel(currencyInfo.currency.chainId)
  if (!currencyInfo.currency.symbol || !currencyInfo.isBridged) {
    return null
  }

  return (
    <Flex gap="$spacing16" alignItems="center">
      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon48} />

      <Flex gap="$spacing8" alignItems="center">
        <Text variant="subheading1" textAlign="center">
          {t('bridgedAsset.modal.title', { currencySymbol: currencyInfo.currency.symbol, chainName })}
        </Text>
        <Text variant="body2" color="$neutral2" textAlign="center" textWrap="wrap" whiteSpace="wrap">
          {t('bridgedAsset.modal.description', { currencySymbol: currencyInfo.currency.symbol, chainName })}
        </Text>
      </Flex>

      <Flex gap="$spacing24" p="$spacing12" alignSelf="stretch">
        <Flex row gap="$spacing20" alignItems="center">
          <Flex width={24} height={24} alignItems="center" justifyContent="center">
            <OrderRouting color="$neutral1" size="$icon.24" />
          </Flex>
          <Flex flex={1}>
            <Text variant="subheading2" color="$neutral1">
              {t('bridgedAsset.modal.feature.tradeSeamlessly')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('bridgedAsset.modal.feature.tradeSeamlessly.description', {
                currencySymbol: currencyInfo.currency.symbol,
              })}
            </Text>
          </Flex>
        </Flex>

        <Flex row gap="$spacing20" alignItems="center">
          <Flex width={24} height={24} alignItems="center" justifyContent="center">
            <Verified color="$neutral1" size="$icon.24" />
          </Flex>
          <Flex flex={1}>
            <Text variant="subheading2" color="$neutral1">
              {t('bridgedAsset.modal.feature.securelyBacked')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('bridgedAsset.modal.feature.securelyBacked.description', {
                currencySymbol: currencyInfo.currency.symbol,
              })}
            </Text>
          </Flex>
        </Flex>

        <Flex row gap="$spacing20" alignItems="center">
          <Flex width={24} height={24} alignItems="center" justifyContent="center">
            <ArrowUpCircle color="$neutral1" size="$icon.24" />
          </Flex>
          <Flex flex={1}>
            <Text variant="subheading2" color="$neutral1">
              {t('bridgedAsset.modal.feature.withdrawToNativeChain', {
                nativeChainName: currencyInfo.bridgedWithdrawalInfo?.chain ?? '',
              })}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('bridgedAsset.modal.feature.withdrawToNativeChain.description', {
                nativeChainName: currencyInfo.bridgedWithdrawalInfo?.chain ?? '',
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export function BridgedAssetModal({
  currencyInfo0,
  currencyInfo1,
  isOpen,
  onClose,
  onContinue,
  modalName = ModalName.BridgedAsset,
}: BridgedAssetModalProps & BaseModalProps): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const hasSecondCurrency = currencyInfo1 !== undefined
  const [showingSecondCurrency, setShowingSecondCurrency] = useState(false)
  const currentCurrencyInfo = useMemo(() => {
    return showingSecondCurrency ? currencyInfo1 : currencyInfo0
  }, [showingSecondCurrency, currencyInfo0, currencyInfo1])
  const { onDismissTokenWarning } = useDismissedBridgedAssetWarnings(currentCurrencyInfo?.currency)

  const { tokenColor } = useExtractedTokenColor({
    imageUrl: currentCurrencyInfo?.logoUrl,
    tokenName: currentCurrencyInfo?.currency.name,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.accent1.val,
  })
  const { validTokenColor } = useColorsFromTokenColor(tokenColor ?? undefined)
  const textColor = useMemo(() => {
    return getContrastPassingTextColor(validTokenColor ?? colors.accent1.val)
  }, [colors.accent1.val, validTokenColor])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +isOpen
  useEffect(() => {
    setShowingSecondCurrency(false)
  }, [isOpen])

  const onPressGetHelp = async (): Promise<void> => {
    await openUri({ uri: uniswapUrls.helpArticleUrls.bridgedAssets })
    onClose()
  }

  const onPressContinue = useEvent(() => {
    onDismissTokenWarning()

    if (hasSecondCurrency && !showingSecondCurrency) {
      setShowingSecondCurrency(true)
      return
    }

    onContinue?.()
    onClose()
  })

  if (!currentCurrencyInfo || !currentCurrencyInfo.currency.symbol) {
    return null
  }

  return (
    <Modal
      name={modalName}
      backgroundColor={colors.surface1.val}
      isDismissible={true}
      isModalOpen={isOpen}
      pt="$spacing16"
      onClose={onClose}
    >
      <Trace logImpression={isOpen} modal={modalName}>
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
              <TouchableArea onPress={onPressGetHelp}>
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
              <ModalCloseIcon onClose={() => onClose()} />
            </Trace>
          </Flex>

          <BridgedAssetModalContent currencyInfo={currentCurrencyInfo} />

          <Flex row>
            <Trace logPress element={ElementName.Continue}>
              <Button
                size="medium"
                emphasis="primary"
                backgroundColor={validTokenColor ?? '$accent1'}
                onPress={onPressContinue}
              >
                <Text variant="buttonLabel1" color={textColor}>
                  {t('bridgedAsset.modal.button')}
                </Text>
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </Trace>
    </Modal>
  )
}
