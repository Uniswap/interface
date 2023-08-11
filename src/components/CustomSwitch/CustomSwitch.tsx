import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import ms from 'ms.macro'
import { useCallback } from 'react'
import { Segment, SegmentedControl } from 'theme/components/SegmentedControl'

interface SwitchItems {
  text: number
  onClick: () => void
  condition: boolean
}

interface CustomSwitchProps {
  width?: number | string
  height?: string
  items: SwitchItems[]
  isLarge?: boolean
  disabled?: boolean
}

enum SwitchMode {
  active,
  ended,
}

const themeModeAtom = atomWithStorage<SwitchMode>('switch-farm', SwitchMode.active)
const THEME_UPDATE_DELAY = ms`0.1s`

export default function CustomSwitch({ disabled, items }: CustomSwitchProps) {
  const [mode, setMode] = useAtom(themeModeAtom)

  const switchMode = useCallback(
    (mode: SwitchMode) => {
      const item = items.find((item) => item.text === mode)
      !disabled &&
        item &&
        setTimeout(() => {
          setMode(mode)
          item.onClick()
        }, THEME_UPDATE_DELAY)
    },
    [disabled, items, setMode]
  )

  return (
    <Row align="center">
      <Row flexGrow={1} justify="flex-end" width="100%">
        <SegmentedControl selected={mode} onSelect={switchMode}>
          <Segment value={SwitchMode.active} testId="theme-auto">
            <Trans>Active</Trans>
          </Segment>
          <Segment value={SwitchMode.ended} testId="theme-lightmode">
            <Trans>Ended</Trans>
          </Segment>
        </SegmentedControl>
      </Row>
    </Row>
  )
}
