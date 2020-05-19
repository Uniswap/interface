import React, { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'

import styled from 'styled-components'

import { useActiveWeb3React } from '../../hooks'
import useInterval from '../../hooks/useInterval'
import { useRemovePopup } from '../../state/application/hooks'
import { TYPE } from '../../theme'

import { Link } from '../../theme/components'
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

  return (
    <AutoRow onMouseEnter={() => setIsRunning(false)} onMouseLeave={() => setIsRunning(true)}>
      {success ? (
        <CheckCircle color={'#27AE60'} size={24} style={{ paddingRight: '24px' }} />
      ) : (
        <AlertCircle color={'#FF6871'} size={24} style={{ paddingRight: '24px' }} />
      )}
      <AutoColumn gap="8px">
        <TYPE.body fontWeight={500}>
          {summary ? summary : 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}
        </TYPE.body>
        <Link href={getEtherscanLink(chainId, hash, 'transaction')}>View on Etherscan</Link>
      </AutoColumn>
      <Fader count={count} />
    </AutoRow>
  )
}
