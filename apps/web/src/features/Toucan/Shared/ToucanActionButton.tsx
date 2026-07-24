import { ReactNode, useMemo } from 'react'
import { Button, ButtonEmphasis, ButtonProps, getContrastPassingTextColor, useColorsFromTokenColor } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { MouseoverTooltip } from '~/components/Tooltip'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

interface ToucanActionButtonProps {
  label: string
  elementName?: ElementName
  onPress: () => void
  isDisabled?: boolean
  loading?: boolean
  shouldUseBranded?: boolean
  shouldUseSoftBranded?: boolean
  disabledTooltip?: ReactNode
  disabledEmphasis?: ButtonEmphasis
  emphasis?: ButtonEmphasis
  'dd-action-name'?: string
}

export function ToucanActionButton({
  label,
  onPress,
  isDisabled = false,
  loading = false,
  shouldUseBranded = false,
  shouldUseSoftBranded = false,
  disabledTooltip,
  disabledEmphasis = 'secondary',
  emphasis,
  'dd-action-name': datadogActionName,
  elementName,
  // oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
  ...props
}: ToucanActionButtonProps & ButtonProps): JSX.Element {
  const tokenColor = useAuctionStore((state) => state.tokenColor)
  const { validTokenColor, lightTokenColor } = useColorsFromTokenColor(tokenColor)

  const textColor = useMemo(() => (tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'), [tokenColor])

  const showDisabledStyle = isDisabled

  const useCustomEmphasis = !showDisabledStyle && !shouldUseBranded && !shouldUseSoftBranded && emphasis

  const button = (
    <Trace logPress={!!elementName} element={elementName}>
      <Button
        fill={false}
        {...(showDisabledStyle
          ? { backgroundColor: '$surface3', emphasis: disabledEmphasis }
          : shouldUseSoftBranded
            ? { backgroundColor: lightTokenColor, variant: 'branded', emphasis: 'secondary' }
            : shouldUseBranded
              ? { variant: 'branded' }
              : useCustomEmphasis
                ? { emphasis }
                : { backgroundColor: validTokenColor, emphasis: 'primary' })}
        disabled={isDisabled}
        loading={loading}
        onPress={onPress}
        dd-action-name={datadogActionName}
      >
        <Button.Text
          color={
            showDisabledStyle
              ? '$neutral2'
              : shouldUseSoftBranded
                ? validTokenColor
                : shouldUseBranded || useCustomEmphasis
                  ? undefined
                  : textColor
          }
        >
          {label}
        </Button.Text>
      </Button>
    </Trace>
  )

  if (isDisabled && disabledTooltip) {
    return (
      <MouseoverTooltip text={disabledTooltip} placement="top">
        {button}
      </MouseoverTooltip>
    )
  }

  return button
}
