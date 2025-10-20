import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const DynamicFeeTierSpeedbump = () => {
  const { setPositionState, dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData } = useCreateLiquidityContext()
  const { t } = useTranslation()

  const handleCancel = () => {
    setDynamicFeeTierSpeedbumpData({
      open: false,
      wishFeeData: dynamicFeeTierSpeedbumpData.wishFeeData,
    })
  }

  const handleConfirm = () => {
    setPositionState((prevState) => ({
      ...prevState,
      fee: {
        feeAmount: dynamicFeeTierSpeedbumpData.wishFeeData.feeAmount,
        tickSpacing: dynamicFeeTierSpeedbumpData.wishFeeData.tickSpacing,
        isDynamic: dynamicFeeTierSpeedbumpData.wishFeeData.isDynamic,
      },
    }))

    setDynamicFeeTierSpeedbumpData({
      open: false,
      wishFeeData: dynamicFeeTierSpeedbumpData.wishFeeData,
    })
  }

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
      primaryButtonText={t('common.button.continue')}
      primaryButtonOnClick={handleConfirm}
      primaryButtonVariant="default"
      secondaryButtonText={t('common.button.cancel')}
      secondaryButtonOnClick={handleCancel}
      modalName={ModalName.DynamicFeeTierSpeedbump}
      displayHelpCTA
    />
  )
}
