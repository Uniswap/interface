import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { LabeledCheckbox } from 'ui/src/components/checkbox/LabeledCheckbox'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { Globe } from 'ui/src/components/icons/Globe'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useGeoRestrictionAcknowledgment } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

type GeoRestrictionModalProps = {
  isOpen: boolean
  onClose: () => void
  // 'default' never reaches the modal — the card short-circuits before rendering.
  mode: 'restricted' | 'unrestricted'
  tokenSymbol?: string
}

type Variant = 'restricted' | 'attest' | 'acknowledged'

export function GeoRestrictionModal({ isOpen, onClose, mode, tokenSymbol }: GeoRestrictionModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { data: ipCountry } = useFiatOnRampAggregatorGetCountryQuery()
  const country = ipCountry?.displayName
  const { hasAcknowledged, setAcknowledged, isPending } = useGeoRestrictionAcknowledgment()

  const variant: Variant = mode === 'restricted' ? 'restricted' : hasAcknowledged ? 'acknowledged' : 'attest'

  const learnMore = (
    <TouchableArea onPress={() => openUri({ uri: UniswapHelpUrls.articles.geoRestriction })}>
      <Text color="$accent3" mt="$spacing4" textAlign="center" variant="buttonLabel3">
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )

  if (variant === 'attest') {
    return (
      <AttestationContent
        isOpen={isOpen}
        tokenSymbol={tokenSymbol}
        learnMore={learnMore}
        surface3={colors.surface3.val}
        isPending={isPending}
        onClose={onClose}
        onContinue={async () => {
          try {
            await setAcknowledged()
            onClose()
          } catch (error) {
            // Keep the modal open so the user can retry the attestation.
            logger.error(error, {
              tags: { file: 'GeoRestrictionModal', function: 'onContinue' },
            })
          }
        }}
      />
    )
  }

  const isRestricted = variant === 'restricted'

  // Fall back to complete generic strings when the token symbol or country is unavailable,
  // rather than interpolating a translated fallback into another translated string (breaks
  // grammar in some languages).
  const title = ((): string => {
    if (isRestricted) {
      return tokenSymbol && country
        ? t('swap.geoRestriction.modal.restricted.title', { tokenSymbol, country })
        : t('swap.geoRestriction.modal.restricted.titleGeneric')
    }
    return tokenSymbol
      ? t('swap.geoRestriction.modal.acknowledged.title', { tokenSymbol })
      : t('swap.geoRestriction.modal.acknowledged.titleGeneric')
  })()

  const caption = ((): string => {
    if (isRestricted) {
      return tokenSymbol && country
        ? t('swap.geoRestriction.modal.restricted.caption', { tokenSymbol, country })
        : t('swap.geoRestriction.modal.restricted.captionGeneric')
    }
    return tokenSymbol && country
      ? t('swap.geoRestriction.modal.acknowledged.caption', { tokenSymbol, country })
      : t('swap.geoRestriction.modal.acknowledged.captionGeneric')
  })()

  return (
    <WarningModal
      isOpen={isOpen}
      modalName={ModalName.GeoRestriction}
      severity={WarningSeverity.None}
      backgroundIconColor={colors.surface3.val}
      icon={
        isRestricted ? (
          <Globe color="$neutral1" size="$icon.24" />
        ) : (
          <InfoCircleFilled color="$neutral1" size="$icon.24" />
        )
      }
      title={title}
      caption={caption}
      acknowledgeText={t('common.button.close')}
      acknowledgeButtonEmphasis="secondary"
      onClose={onClose}
      onAcknowledge={onClose}
    >
      {learnMore}
    </WarningModal>
  )
}

function AttestationContent({
  isOpen,
  tokenSymbol,
  learnMore,
  surface3,
  isPending,
  onClose,
  onContinue,
}: {
  isOpen: boolean
  tokenSymbol?: string
  learnMore: JSX.Element
  surface3: string
  isPending: boolean
  onClose: () => void
  onContinue: () => void
}): JSX.Element {
  const { t } = useTranslation()
  // The card only mounts this modal while open (`isOpen && <GeoRestrictionModal />`), so the
  // checkbox resets to its default on each reopen via remount — no reset effect needed.
  const [isChecked, setIsChecked] = useState(false)

  // `LabeledCheckbox`'s handler fires for both the checkbox and the row click, and
  // already calls `e.stopPropagation()`, so we just flip the captured `currentState`.
  const onCheckPressed = (currentState: boolean): void => {
    setIsChecked(!currentState)
  }

  const caption = tokenSymbol
    ? t('swap.geoRestriction.modal.attest.caption', { tokenSymbol })
    : t('swap.geoRestriction.modal.attest.captionGeneric')

  const checkboxText = t('swap.geoRestriction.modal.attest.checkboxUS')

  return (
    <WarningModal
      isOpen={isOpen}
      modalName={ModalName.GeoRestriction}
      severity={WarningSeverity.None}
      backgroundIconColor={surface3}
      icon={<Globe color="$neutral1" size="$icon.24" />}
      title={t('swap.geoRestriction.modal.attest.title')}
      caption={caption}
      closeHeaderComponent={
        <Flex row alignSelf="stretch" alignItems="center" justifyContent="flex-end" gap="$spacing8">
          <TouchableArea
            px="$spacing8"
            py="$spacing4"
            borderRadius="$rounded12"
            borderWidth={1}
            borderColor="$surface3"
            onPress={() => openUri({ uri: UniswapHelpUrls.articles.geoRestriction })}
          >
            <Flex row alignItems="center" gap="$spacing4">
              <EnvelopeHeart color="$neutral1" size="$icon.16" />
              <Text color="$neutral1" variant="buttonLabel4">
                {t('common.getHelp.button')}
              </Text>
            </Flex>
          </TouchableArea>
          <TouchableArea onPress={onClose}>
            <X color="$neutral2" size="$icon.24" />
          </TouchableArea>
        </Flex>
      }
      onClose={onClose}
    >
      {learnMore}
      <Flex alignSelf="stretch" backgroundColor="$surface2" borderRadius="$rounded16" px="$spacing4" py="$spacing4">
        <LabeledCheckbox
          checked={isChecked}
          size="$icon.20"
          gap="$spacing12"
          px="$spacing12"
          py="$spacing12"
          text={
            <Text color="$neutral1" variant="body3">
              {checkboxText}
            </Text>
          }
          onCheckPressed={onCheckPressed}
        />
      </Flex>
      <Flex row alignSelf="stretch">
        <Button size="medium" emphasis="primary" disabled={!isChecked || isPending} onPress={onContinue}>
          {t('swap.geoRestriction.modal.attest.continue')}
        </Button>
      </Flex>
    </WarningModal>
  )
}
