import React from 'react'
import { Text } from 'rebass/styled-components'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { GroupButtonReturnTypes, ButtonReturnType } from './styleds'
import { Trans } from '@lingui/macro'
import { GasStation, MoneyFill } from 'components/Icons'

export default function TradeTypeSelection() {
  const { saveGas } = useSwapState()
  const { onChooseToSaveGas } = useSwapActionHandlers()
  return (
    <GroupButtonReturnTypes>
      <ButtonReturnType onClick={() => onChooseToSaveGas(false)} active={!saveGas} role="button">
        <MoneyFill />
        <Text marginLeft="4px">
          <Trans>Maximum Return</Trans>
        </Text>
      </ButtonReturnType>
      <ButtonReturnType onClick={() => onChooseToSaveGas(true)} active={saveGas} role="button">
        <GasStation />
        <Text marginLeft="4px">
          <Trans>Lowest Gas</Trans>
        </Text>
      </ButtonReturnType>
    </GroupButtonReturnTypes>
  )
}
