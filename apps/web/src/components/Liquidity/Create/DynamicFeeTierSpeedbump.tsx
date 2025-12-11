import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const DynamicFeeTierSpeedbump = () => {
  const { setPositionState, dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData } = useCreateLiquidityContext()
  const { t } = useTranslation()

  const handleCancel = useCallback(() => {
    setDynamicFeeTierSpeedbumpData({
      open: false,
      wishFeeData: dynamicFeeTierSpeedbumpData.wishFeeData,
    })
  }, [setDynamicFeeTierSpeedbumpData, dynamicFeeTierSpeedbumpData.wishFeeData])

  const handleConfirm = useCallback(() => {
    setPositionState((prevState) => ({
      ...prevState,
      fee: dynamicFeeTierSpeedbumpData.wishFeeData
        ? {
            feeAmount: dynamicFeeTierSpeedbumpData.wishFeeData.feeAmount,
            tickSpacing: dynamicFeeTierSpeedbumpData.wishFeeData.tickSpacing,
            isDynamic: dynamicFeeTierSpeedbumpData.wishFeeData.isDynamic,
          }
        : undefined,
    }))

    setDynamicFeeTierSpeedbumpData({
      open: false,
      wishFeeData: dynamicFeeTierSpeedbumpData.wishFeeData,
    })
  }, [setPositionState, setDynamicFeeTierSpeedbumpData, dynamicFeeTierSpeedbumpData.wishFeeData])

  const primaryButton = useMemo(
    () => ({
      testID: TestID.DynamicFeeTierSpeedbumpContinue,
      text: t('common.button.continue'),
      onPress: handleConfirm,
      variant: 'default' as const,
    }),
    [t, handleConfirm],
  )

  const secondaryButton = useMemo(() => ({ text: t('common.button.cancel'), onPress: handleCancel }), [t, handleCancel])

  if (!dynamicFeeTierSpeedbumpData.open) {
    return null
  }

  return (
    <Dialog
      icon={
        <Flex
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <InfoCircleFilled size="$icon.24" color="$neutral1" />
        </Flex>
      }
      isOpen={true}
      title={t('fee.tier.dynamic.create')}
      subtext={t('fee.tier.dynamic.create.info')}
      onClose={handleCancel}
      primaryButton={primaryButton}
      secondaryButton={secondaryButton}
      modalName={ModalName.DynamicFeeTierSpeedbump}
      displayHelpCTA
    />
  )
}
