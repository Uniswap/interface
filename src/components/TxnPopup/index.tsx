import React, { useCallback, useContext, useState } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'

import styled, { ThemeContext } from 'styled-components'

import { useActiveWeb3React } from '../../hooks'
import useInterval from '../../hooks/useInterval'
import { useRemovePopup } from '../../state/application/hooks'
import { TYPE } from '../../theme'

import { ExternalLink } from '../../theme/components'
import { getEtherscanLink } from '../../utils'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const Fader = styled.div<{ count: number }>`
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: ${({ count }) => `calc(100% - (100% / ${150 / count}))`};
  height: 2px;
  background-color: ${({ theme }) => theme.bg3};
  transition: width 100ms linear;
`

const delay = 100

export default function TxnPopup({
  hash,
  success,
  summary,
  popKey
}: {
  hash: string
  success?: boolean
  summary?: string
  popKey?: string
}) {
  const { chainId } = useActiveWeb3React()
  const [count, setCount] = useState(1)

  const [isRunning, setIsRunning] = useState(true)
  const removePopup = useRemovePopup()

  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])

  useInterval(
    () => {
      count > 150 ? removeThisPopup() : setCount(count + 1)
    },
    isRunning ? delay : null
  )

  const handleMouseEnter = useCallback(() => setIsRunning(false), [])
  const handleMouseLeave = useCallback(() => setIsRunning(true), [])

  const theme = useContext(ThemeContext)

  return (
    <AutoRow onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div style={{ paddingRight: 16 }}>
        {success ? <CheckCircle color={theme.green1} size={24} /> : <AlertCircle color={theme.red1} size={24} />}
      </div>
      <AutoColumn gap="8px">
        <TYPE.body fontWeight={500}>{summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}</TYPE.body>
        <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>View on Etherscan</ExternalLink>
      </AutoColumn>
      <Fader count={count} />
    </AutoRow>
  )
}
