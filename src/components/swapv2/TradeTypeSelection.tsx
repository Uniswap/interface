import { Trans } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass/styled-components'

import { GasStation, MoneyFill } from 'components/Icons'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'

import { ButtonReturnType, GroupButtonReturnTypes } from './styleds'

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
