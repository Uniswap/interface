import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import Toggle from 'components/Toggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ThemedText } from 'theme'

export const hideTestnetsAtom = atomWithStorage<boolean>('hideTestnets', true)

export function TestnetsToggle() {
  const [hideTestnets, updateHideTestnets] = useAtom(hideTestnetsAtom)

  return (
    <Row align="center">
      <Row width="50%">
        <ThemedText.SubHeaderSmall color="primary">
          <Trans>Hide testnets</Trans>
        </ThemedText.SubHeaderSmall>
      </Row>
      <Row width="50%" justify="flex-end">
        <Toggle
          isActive={hideTestnets}
          toggle={() => {
            updateHideTestnets(!hideTestnets)
          }}
        />
      </Row>
    </Row>
  )
}
