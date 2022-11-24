import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import { network } from 'connectors'
import { NetworkContextName } from 'constants/index'
import { useActiveWeb3React, useEagerConnect, useInactiveListener, useWeb3React } from 'hooks'
import { AppState } from 'state'
import { updateChainId } from 'state/user/actions'

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`

const Message = styled.h2`
  color: ${({ theme }) => theme.primary};
`

export default function Web3ReactManager({ children }: { children: JSX.Element }) {
  const chainIdState = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET
  const { isEVM } = useActiveWeb3React()
  const { active, chainId } = useWeb3React()
  const { active: networkActive, error: networkError, activate: activateNetwork } = useWeb3React(NetworkContextName)

  // try to eagerly connect to an injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // after eagerly trying injected, if the network connect ever isn't active or in an error state, activate itd
  useEffect(() => {
    if (isEVM && triedEager && !networkActive && !networkError && !active) {
      activateNetwork(network)
    }
  }, [triedEager, networkActive, networkError, activateNetwork, active, isEVM])

  // when there's no account connected, react to logins (broadly speaking) on the injected provider, if it exists
  useInactiveListener(!triedEager)
  const dispatch = useDispatch()
  /** On user change network from wallet, update chainId in store */
  useEffect(() => {
    if (triedEager && chainId && chainIdState !== chainId && active) {
      dispatch(updateChainId(chainId))
    }
    // Only run on change network from wallet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, triedEager, active])

  // on page load, do nothing until we've tried to connect to the injected connector
  if (isEVM && !triedEager) {
    return <LocalLoader />
  }

  // if the account context isn't active, and there's an error on the network context, it's an irrecoverable error
  if (isEVM && !active && networkError) {
    return (
      <MessageWrapper>
        <Message>
          <Trans>
            Oops! An unknown error occurred. Please refresh the page, or visit from another browser or device.
          </Trans>
        </Message>
      </MessageWrapper>
    )
  }

  return children
}
