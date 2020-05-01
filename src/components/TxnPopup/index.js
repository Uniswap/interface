import React, { useState, useEffect, useRef } from 'react'

import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'
import { usePopups } from '../../contexts/Application'

import { CheckCircle, AlertCircle } from 'react-feather'

import styled from 'styled-components'

const Fader = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: ${({ count }) => `calc(100% - (100% / ${150 / count}))`};
  height: 2px;
  background-color: ${({ theme }) => theme.bg3};
  transition: width 100ms linear;
`

function useInterval(callback, delay) {
  const savedCallback = useRef()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
    return () => {}
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    return () => {}
  }, [delay])
}

const delay = 100

export default function TxnPopup({ hash, success, summary, popKey }) {
  const { chainId } = useWeb3React()
  let [count, setCount] = useState(1)

  const [isRunning, setIsRunning] = useState(true)
  const [, , removePopup] = usePopups()

  useInterval(
    () => {
      count > 150 && removePopup(popKey)
      setCount(count + 1)
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
