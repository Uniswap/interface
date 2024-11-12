import { Dialog } from 'components/Dialog/Dialog'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Button, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Trans } from 'uniswap/src/i18n'

export const DynamicFeeTierSpeedbump = () => {
  const { setPositionState, dynamicFeeTierSpeedbumpData, setDynamicFeeTierSpeedbumpData } = useCreatePositionContext()

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
          <Button
            flex={1}
            theme="secondary"
            borderRadius="$rounded12"
            py="$spacing8"
            px="$spacing12"
            onPress={handleCancel}
          >
            <Text variant="buttonLabel3" color="$neutral1">
              <Trans i18nKey="common.button.cancel" />
            </Text>
          </Button>
        ),
        right: (
          <Button
            flex={1}
            borderRadius="$rounded12"
            py="$spacing8"
            px="$spacing12"
            backgroundColor="$accent3"
            hoverStyle={{
              backgroundColor: undefined,
              opacity: 0.8,
            }}
            pressStyle={{
              backgroundColor: undefined,
            }}
            onPress={handleConfirm}
          >
            <Text variant="buttonLabel3" color="$surface1">
              <Trans i18nKey="common.button.continue" />
            </Text>
          </Button>
        ),
      }}
    />
  )
}
