import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { DeprecatedButton, Flex, GeneratedIcon, Image, Text, TouchableArea } from 'ui/src'
import { UNICHAIN_PROMO_MODAL_GIF } from 'ui/src/assets'
import { BadgeDollar } from 'ui/src/components/icons/BadgeDollar'
import { ChartBarAxis } from 'ui/src/components/icons/ChartBarAxis'
import { UniswapXUncolored } from 'ui/src/components/icons/UniswapXUncolored'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { setHasDismissedUnichainColdBanner } from 'uniswap/src/features/behaviorHistory/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isExtension, isInterface, isMobileApp, isMobileWeb } from 'utilities/src/platform'

export function UnichainIntroModal({
  onClose,
  openSwapFlow,
}: {
  onClose: () => void
  openSwapFlow: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const onPressGetStarted = useMemo(() => {
    return () => {
      openSwapFlow()
      onClose()
      dispatch(setHasDismissedUnichainColdBanner(true))
    }
  }, [openSwapFlow, onClose, dispatch])

  const assetSize = isInterface && !isMobileWeb ? 300 : 200
  const isWebNonMobile = isExtension || (isInterface && !isMobileWeb)

  return (
    <Modal name={ModalName.UnichainIntro} onClose={onClose}>
      {isWebNonMobile && (
        <TouchableArea flexDirection="row" justifyContent="flex-end" onPress={onClose}>
          <X size="$icon.20" color="$neutral3" />
        </TouchableArea>
      )}
      <Flex
        gap="$gap24"
        mx={isExtension ? '$spacing12' : isInterface && !isMobileWeb ? undefined : '$spacing24'}
        my="$spacing6"
      >
        <Flex gap="$gap16">
          <Flex centered gap="$spacing2">
            <Text variant="subheading1" color="$neutral1">
              {t('unichain.promotion.cold.title')}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {t('unichain.promotion.modal.description')}
            </Text>
          </Flex>
          <Flex centered>
            <Image
              source={UNICHAIN_PROMO_MODAL_GIF}
              style={{
                borderRadius: 20,
                height: assetSize,
                width: assetSize,
              }}
            />
          </Flex>
          <Flex gap="$spacing8" px="$spacing8">
            <DetailRow Icon={UniswapXUncolored} text={t('unichain.promotion.modal.detail.instant')} />
            <DetailRow Icon={BadgeDollar} text={t('unichain.promotion.modal.detail.fees')} />
            <DetailRow Icon={ChartBarAxis} text={t('unichain.promotion.modal.detail.costs')} />
          </Flex>
        </Flex>

        <DeprecatedButton
          size="medium"
          theme="primary"
          mb={isMobileApp || isMobileWeb ? '$spacing24' : undefined}
          onPress={onPressGetStarted}
        >
          {t('common.getStarted')}
        </DeprecatedButton>
      </Flex>
    </Modal>
  )
}

function DetailRow({ Icon, text }: { Icon: GeneratedIcon; text: string }): JSX.Element {
  return (
    <Flex row gap="$spacing8" alignItems="flex-start">
      <Icon size="$icon.20" color="$accent1" />
      <Text variant="body3" color="$neutral2">
        {text}
      </Text>
    </Flex>
  )
}
