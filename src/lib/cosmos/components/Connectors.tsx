import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { SupportedChainId } from 'constants/chains'
import { useAtom } from 'jotai'
import { providerAtom } from 'lib/cosmos.decorator'
import styled from 'lib/theme'
import { useEffect, useState } from 'react'
import { Web3ReactHooks } from 'widgets-web3-react/core'
import { MetaMask } from 'widgets-web3-react/metamask'
import { Network } from 'widgets-web3-react/network'
import { Connector } from 'widgets-web3-react/types'

import { connectors } from '../connectors'
import { hooks as metaMaskHooks, metaMask } from '../connectors/metaMask'
import { hooks as networkHooks, network } from '../connectors/network'

function getName(connector: Connector) {
  if (connector instanceof MetaMask) {
    return 'MetaMask'
  }
  return 'Network'
}

function Status({ connector, hooks: { useError, useIsActive } }: { connector: Connector; hooks: Web3ReactHooks }) {
  const error = useError()
  const connected = useIsActive()

  return (
    <div>
      <b>{getName(connector)}</b>
      <br />
      {error ? (
        <>
          🛑 {error.name ?? 'Error'}: {error.message}
        </>
      ) : connected ? (
        <>✅ Connected</>
      ) : (
        <>⚠️ Disconnected</>
      )}
    </div>
  )
}

function ChainId({ hooks: { useChainId } }: { hooks: Web3ReactHooks }) {
  const chainId = useChainId()

  return <div>Chain Id: {chainId ? <b>{chainId}</b> : '-'}</div>
}

function useBalances(
  provider?: ReturnType<Web3ReactHooks['useProvider']>,
  accounts?: string[]
): BigNumber[] | undefined {
  const [balances, setBalances] = useState<BigNumber[] | undefined>()

  useEffect(() => {
    if (provider && accounts?.length) {
      let stale = false

      Promise.all(accounts.map((account) => provider.getBalance(account))).then((balances) => {
        if (!stale) {
          setBalances(balances)
        }
      })

      return () => {
        stale = true
        setBalances(undefined)
      }
    }
    return () => {
      setBalances(undefined)
    }
  }, [provider, accounts])

  return balances
}

function Accounts({
  useAnyNetwork,
  hooks: { useAccounts, useProvider, useENSNames },
}: {
  useAnyNetwork: boolean
  hooks: Web3ReactHooks
}) {
  const provider = useProvider(useAnyNetwork ? 'any' : undefined)
  const accounts = useAccounts()
  const ENSNames = useENSNames(provider)

  const balances = useBalances(provider, accounts)

  return (
    <div>
      Accounts:
      {accounts === undefined || accounts.length === 0
        ? ' -'
        : accounts?.map((account, i) => (
            <ul key={account} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <b>{ENSNames?.[i] ?? account}</b>
              <br />
              <span>{balances?.[i] ? ` (Ξ${formatEther(balances[i])})` : null}</span>
            </ul>
          ))}
    </div>
  )
}

function Connect({
  connector,
  hooks: { useChainId, useIsActivating, useError, useIsActive },
}: {
  connector: Connector
  hooks: Web3ReactHooks
}) {
  const chainId = useChainId()
  const isActivating = useIsActivating()
  const error = useError()

  const active = useIsActive()

  const [activateArgs] = useState<any[]>([])

  if (error) {
    return <button onClick={() => connector.activate()}>Try Again?</button>
  } else if (active) {
    return (
      <>
        {connector instanceof Network ? (
          <label>
            Network:
            <select value={`${chainId}`} onChange={(event) => connector.activate(Number(event.target.value))}>
              <option value={SupportedChainId.MAINNET}>Mainnet</option>
              <option value={SupportedChainId.ROPSTEN}>Ropsten</option>
              <option value={SupportedChainId.RINKEBY}>Rinkeby</option>
              <option value={SupportedChainId.GOERLI}>Görli</option>
              <option value={SupportedChainId.KOVAN}>Kovan</option>
              <option value={SupportedChainId.OPTIMISM}>Optimism</option>
              <option value={SupportedChainId.ARBITRUM_ONE}>Arbitrum</option>
            </select>
          </label>
        ) : null}
        <button
          onClick={() => {
            if (connector.deactivate) {
              connector.deactivate()
            }
          }}
          disabled={!connector.deactivate}
        >
          {connector.deactivate ? 'Disconnect' : 'Connected'}
        </button>
      </>
    )
  } else {
    return (
      <button
        onClick={() => {
          if (!isActivating) {
            connector.activate(...activateArgs)
          }
        }}
        disabled={isActivating}
      >
        {isActivating ? 'Connecting...' : 'Activate'}
      </button>
    )
  }
}

const Wrapper = styled.div`
  background-color: rgb(32, 32, 32);
  display: flex;
  flex-direction: row;
  margin-bottom: 14px;
`
const ConnectorWrapper = styled.div`
  align-items: flex-start;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgb(248, 248, 248);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, Ubuntu, 'Helvetica Neue', Helvetica, sans-serif;
  font-size: 14px;
  margin: 14px;
  padding: 14px;
`
export default function Connectors() {
  const [, setProvider] = useAtom(providerAtom)
  const isMetaMaskActive = metaMaskHooks.useIsActive()
  const isNetworkActive = networkHooks.useIsActive()
  useEffect(() => {
    if (isMetaMaskActive) {
      setProvider(metaMask.provider as any)
    } else if (isNetworkActive) {
      setProvider(network.provider as any)
    } else {
      setProvider(undefined)
    }
  }, [isMetaMaskActive, isNetworkActive, setProvider])
  return (
    <Wrapper>
      {connectors.map(([connector, hooks], i) => (
        <ConnectorWrapper key={i}>
          <div>
            <Status connector={connector} hooks={hooks} />
            <br />
            <ChainId hooks={hooks} />
            <Accounts useAnyNetwork={true} hooks={hooks} />
            <br />
          </div>
          <Connect connector={connector} hooks={hooks} />
        </ConnectorWrapper>
      ))}
    </Wrapper>
  )
}
