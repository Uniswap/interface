import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { Switch } from 'ui/src'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'
import { useEvent } from 'utilities/src/react/hooks'

const oneClickSwapAtom = atom(true)

/** Used to disable one-click swaps after a failed submission, intended for the duration of the transaction. */
const overrideOneClickSwapFlagAtom = atom(false)

export function useResetOverrideOneClickSwapFlag(): () => void {
  const setOverrideOneClickSwapFlag = useUpdateAtom(overrideOneClickSwapFlagAtom)
  return useEvent(() => setOverrideOneClickSwapFlag(false))
}

export function useSetOverrideOneClickSwapFlag(): () => void {
  const setOverrideOneClickSwapFlag = useUpdateAtom(overrideOneClickSwapFlagAtom)
  return useEvent(() => setOverrideOneClickSwapFlag(true))
}

export function useOneClickSwapSetting() {
  const isOneClickSwapEnabled = useAtomValue(oneClickSwapAtom)
  const overrideOneClickSwap = useAtomValue(overrideOneClickSwapFlagAtom)
  const updateOneClickSwapEnabled = useUpdateAtom(oneClickSwapAtom)
  const resetOverrideOneClickSwapFlag = useResetOverrideOneClickSwapFlag()

  const enabled = isOneClickSwapEnabled && !overrideOneClickSwap

  const toggle = useEvent((value: boolean) => {
    updateOneClickSwapEnabled(value)

    // If the user manually enables one-click, any override flag is cleared
    if (value) {
      resetOverrideOneClickSwapFlag()
    }
  })

  return { enabled, toggle }
}

export const OneClickSwap: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.oneClickSwap.title'),
  renderTooltip: (t) => t('swap.settings.oneClickSwap.tooltip'),
  applicablePlatforms: [Platform.EVM],
  Control() {
    const oneClickSwapSetting = useOneClickSwapSetting()
    return (
      <Switch checked={oneClickSwapSetting.enabled} variant="branded" onCheckedChange={oneClickSwapSetting.toggle} />
    )
  },
}
