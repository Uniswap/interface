import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import Toggle from 'components/Toggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ThemedText } from 'theme'

export const hideSmallBalancesAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function SmallBalanceToggle() {
  const [hideSmallBalances, updateHideSmallBalances] = useAtom(hideSmallBalancesAtom)

  return (
    <Row align="center">
      <Row width="50%">
        <ThemedText.SubHeaderSmall color="primary">
          <Trans>Hide small balances</Trans>
        </ThemedText.SubHeaderSmall>
      </Row>
      <Row width="50%" justify="flex-end">
        <Toggle
          isActive={hideSmallBalances}
          toggle={() => {
            updateHideSmallBalances(!hideSmallBalances)
          }}
        />
      </Row>
    </Row>
  )
}
