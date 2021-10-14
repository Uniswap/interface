import { AutoColumn } from 'components/Column'
import React from 'react'
import { Flex } from 'rebass/styled-components'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { GroupButtonReturnTypes } from './styleds'
import { t } from '@lingui/macro'

const svgMap = [
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.00004 1.33331C4.32004 1.33331 1.33337 4.31998 1.33337 7.99998C1.33337 11.68 4.32004 14.6666 8.00004 14.6666C11.68 14.6666 14.6667 11.68 14.6667 7.99998C14.6667 4.31998 11.68 1.33331 8.00004 1.33331ZM8.00004 13.3333C5.05337 13.3333 2.66671 10.9466 2.66671 7.99998C2.66671 5.05331 5.05337 2.66665 8.00004 2.66665C10.9467 2.66665 13.3334 5.05331 13.3334 7.99998C13.3334 10.9466 10.9467 13.3333 8.00004 13.3333Z"
      fill="#C3C5CB"
    />
  </svg>,
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.00004 1.33331C4.32004 1.33331 1.33337 4.31998 1.33337 7.99998C1.33337 11.68 4.32004 14.6666 8.00004 14.6666C11.68 14.6666 14.6667 11.68 14.6667 7.99998C14.6667 4.31998 11.68 1.33331 8.00004 1.33331ZM8.00004 13.3333C5.05337 13.3333 2.66671 10.9466 2.66671 7.99998C2.66671 5.05331 5.05337 2.66665 8.00004 2.66665C10.9467 2.66665 13.3334 5.05331 13.3334 7.99998C13.3334 10.9466 10.9467 13.3333 8.00004 13.3333Z"
      fill="#08A1E7"
    />
    <path
      d="M7.99996 11.3334C9.84091 11.3334 11.3333 9.84097 11.3333 8.00002C11.3333 6.15907 9.84091 4.66669 7.99996 4.66669C6.15901 4.66669 4.66663 6.15907 4.66663 8.00002C4.66663 9.84097 6.15901 11.3334 7.99996 11.3334Z"
      fill="#08A1E7"
    />
  </svg>
]

export default function TradeTypeSelection() {
  const { saveGas } = useSwapState()
  const { onChooseToSaveGas } = useSwapActionHandlers()
  return (
    <AutoColumn style={{ marginTop: '20px' }}>
      <GroupButtonReturnTypes>
        <Flex className={`button-return-type`} onClick={() => onChooseToSaveGas(false)}>
          {svgMap[saveGas ? 0 : 1]}
          <div>{t`Maximum Return`}</div>
        </Flex>
        <Flex className={`button-return-type`} onClick={() => onChooseToSaveGas(true)}>
          {svgMap[saveGas ? 1 : 0]}
          <div>{t`Lowest Gas`}</div>
        </Flex>
      </GroupButtonReturnTypes>
    </AutoColumn>
  )
}
