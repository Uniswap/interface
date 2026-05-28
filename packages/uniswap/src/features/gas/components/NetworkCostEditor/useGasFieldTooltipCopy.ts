import { useTranslation } from 'react-i18next'
import type { GeneratedIcon } from 'ui/src'
import { FastForward } from 'ui/src/components/icons/FastForward'
import { Gas } from 'ui/src/components/icons/Gas'
import { WavePulse } from 'ui/src/components/icons/WavePulse'
import type { GasTooltipKey } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip'

type TooltipContent = {
  title: string
  body: string
  Icon: GeneratedIcon
}

/** Shared title/body/icon for the gas-field tooltip across web and native.
 * The web tooltip ignores `Icon`; only the mobile bottom sheet renders it. */
export function useTooltipCopy(tooltipKey: GasTooltipKey): TooltipContent {
  const { t } = useTranslation()
  switch (tooltipKey) {
    case 'maxBaseFee':
      return {
        title: t('gas.override.tooltip.maxBaseFee.title'),
        body: t('gas.override.tooltip.maxBaseFee.body'),
        Icon: WavePulse,
      }
    case 'priorityFee':
      return {
        title: t('gas.override.tooltip.priorityFee.title'),
        body: t('gas.override.tooltip.priorityFee.body'),
        Icon: FastForward,
      }
    case 'gasLimit':
      return {
        title: t('gas.override.tooltip.gasLimit.title'),
        body: t('gas.override.tooltip.gasLimit.body'),
        Icon: Gas,
      }
    default:
      throw new Error('unreachable tooltipKey: ' + tooltipKey)
  }
}
