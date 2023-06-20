import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import Toggle from 'components/Toggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ThemedText } from 'theme'

export const showTestnetsAtom = atomWithStorage<boolean>('showTestnets', false)

export function TestnetsToggle() {
  const [showTestnets, updateShowTestnets] = useAtom(showTestnetsAtom)

  return (
    <Row align="center">
      <Row width="50%">
        <ThemedText.SubHeaderSmall color="primary">
          <Trans>Show testnets</Trans>
        </ThemedText.SubHeaderSmall>
      </Row>
      <Row width="50%" justify="flex-end">
        <Toggle
          id="testnets-toggle"
          isActive={showTestnets}
          toggle={() => {
            updateShowTestnets(!showTestnets)
          }}
        />
      </Row>
    </Row>
  )
}
