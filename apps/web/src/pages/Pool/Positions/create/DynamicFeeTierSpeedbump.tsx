import { Dialog } from 'components/Dialog/Dialog'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

export const DynamicFeeTierSpeedbump = () => {
  const { setPositionState, dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData } = useCreatePositionContext()
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
      icon={<InfoCircleFilled size="$icon.24" color="$neutral1" />}
      isVisible={true}
      title={<Trans i18nKey="fee.tier.dynamic.create" />}
      description={<Trans i18nKey="fee.tier.dynamic.create.info" />}
      onCancel={handleCancel}
      buttonsConfig={{
        left: (
          <Button size="small" emphasis="secondary" onPress={handleCancel}>
            {t('common.button.cancel')}
          </Button>
        ),
        right: (
          <Button size="small" onPress={handleConfirm}>
            {t('common.button.continue')}
          </Button>
        ),
      }}
    />
  )
}
