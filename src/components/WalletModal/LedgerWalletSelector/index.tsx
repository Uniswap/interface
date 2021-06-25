import { AbstractConnector } from '@web3-react/abstract-connector'
import Loader from 'components/Loader'
import { darken } from 'polished'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { NETWORK_CHAIN_ID } from '../../../connectors'
import { LedgerKit } from '../../../connectors/ledger/LedgerConnector'
import { LedgerAddress } from './LedgerAddress'

interface Props {
  tryActivation: (connector: AbstractConnector | undefined) => Promise<void>
}

const ADDRESSES_PER_PAGE = 5

export const LedgerWalletSelector: React.FC<Props> = ({ tryActivation }: Props) => {
  const [addresses, setAddresses] = useState<readonly string[] | null>(null)
  const [kit, setKit] = useState<LedgerKit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)

  const connectToLedger = useCallback(async () => {
    setError(null)
    const idxs = Array(ADDRESSES_PER_PAGE)
      .fill(null)
      .map((_, i) => page * ADDRESSES_PER_PAGE + i)
    try {
      const ledgerKit = await LedgerKit.init(NETWORK_CHAIN_ID, idxs)
      setAddresses(ledgerKit.wallet.getAccounts())
      setKit(ledgerKit)
    } catch (e) {
      setError(e.message)
    }
  }, [page])

  useEffect(() => {
    ;(async () => {
      await connectToLedger()
    })()
  }, [connectToLedger])

  return (
    <>
      <Heading>Connect to Ledger</Heading>
      {error ? (
        <ErrorGroup>
          <div>
            <p>{error}</p>
            {error.includes('Unable to claim interface.') && <p>Try restarting your Ledger.</p>}
          </div>
          <ErrorButton
            onClick={() => {
              void connectToLedger()
            }}
          >
            Try Again
          </ErrorButton>
        </ErrorGroup>
      ) : (
        <>
          <p>Please select a wallet below.</p>
          {addresses === null || kit === null ? (
            <InfoCard>
              <span>
                Loading wallets... <Loader />
              </span>
            </InfoCard>
          ) : (
            <OptionsGrid>
              {addresses.map((address, i) => (
                <LedgerAddress key={address} address={address} kit={kit} tryActivation={tryActivation} index={i} />
              ))}
              <InfoCard
                onClick={() => {
                  setAddresses(null)
                  setKit(null)
                  setPage(page + 1)
                }}
              >
                Load more
              </InfoCard>
            </OptionsGrid>
          )}
        </>
      )}
    </>
  )
}

const OptionsGrid = styled.div`
  display: grid;
  grid-row-gap: 10px;
`

const Heading = styled.h3`
  margin-top: 0;
`

export const InfoCard = styled.button`
  background-color: ${({ theme }) => theme.bg2};
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
  width: 100% !important;
  color: ${({ theme }) => theme.text1};
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.primary1};
  }
  border-color: ${({ theme }) => theme.bg3};

  margin-top: 0;
  &:hover {
    cursor: pointer;
    border: ${({ theme }) => `1px solid ${theme.primary1}`};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};

  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg4};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.text4)};
  }
`
