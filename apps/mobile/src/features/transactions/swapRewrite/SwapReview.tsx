import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Arrow } from 'src/components/icons/Arrow'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { SwapScreen, useSwapContext } from 'src/features/transactions/swapRewrite/SwapContext'
import { Flex, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function SwapReview(): JSX.Element {
  const colors = useSporeColors()

  const { updateSwapForm } = useSwapContext()

  const onClose = useCallback((): void => {
    updateSwapForm({ screen: SwapScreen.SwapForm })
  }, [updateSwapForm])

  return (
    <BottomSheetModal
      disableSwipe
      backgroundColor={colors.surface1.val}
      name={ModalName.SwapReview}
      onClose={onClose}>
      <Screen noInsets bg="$surface1" margin="$spacing16" marginBottom="$spacing48">
        <SwapReviewContent onClose={onClose} />
      </Screen>
    </BottomSheetModal>
  )
}

function SwapReviewContent({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <>
      <Text>TODO: implement review screen</Text>

      <Flex row gap="$spacing8" mt="$spacing24">
        <Button
          CustomIcon={<Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon24} />}
          emphasis={ButtonEmphasis.Tertiary}
          size={ButtonSize.Large}
          onPress={onClose}
        />
        <Button
          fill
          label={t('Confirm swap')}
          size={ButtonSize.Large}
          testID={ElementName.Confirm}
        />
      </Flex>
    </>
  )
}
