import React, { useState } from 'react'

import Copy from '../AccountDetails/Copy'
import TokenLogo from '../TokenLogo'
import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { Hover } from '../../theme'
import { GreyCard } from '../Card'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { ChevronDown, ChevronUp } from 'react-feather'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

export default function BalanceCard({ token0, balance0, import0, token1, balance1, import1 }) {
  const [details0, setDetails0] = useState(false)
  const [details1, setDetails1] = useState(false)

  const { chainId } = useWeb3React()

  return (
    <AutoColumn gap="lg">
      <GreyCard>
        <AutoColumn gap="md">
          <TYPE.black>Selected Tokens</TYPE.black>
          {token0 && balance0 && (
            <Hover onClick={() => setDetails0(!details0)}>
              <RowBetween>
                <RowFixed>
                  <TokenLogo address={token0?.address || ''} />
                  <TYPE.black marginLeft="10px">
                    {token0?.name} ({token0?.symbol})
                  </TYPE.black>
                </RowFixed>
                <RowFixed>
                  <TYPE.black>{balance0?.toSignificant(6)}</TYPE.black>
                  {details0 ? (
                    <ChevronUp size="20" style={{ marginLeft: '10px' }} color="black" />
                  ) : (
                    <ChevronDown size="20" style={{ marginLeft: '10px' }} color="black" />
                  )}
                </RowFixed>
              </RowBetween>
              {import0 && <TYPE.yellow style={{ paddingLeft: '32px' }}>Token imported by user</TYPE.yellow>}
            </Hover>
          )}
          {details0 && (
            <AutoColumn gap="sm" style={{ marginTop: '2px', marginBottom: '6px' }}>
              <RowFixed>
                <TYPE.blue style={{ paddingLeft: '32px' }}>Copy token address</TYPE.blue>
                <Copy toCopy={token0?.address} />
              </RowFixed>
              <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
                View on etherscan
              </Link>
            </AutoColumn>
          )}
          {token1 && balance1 && (
            <Hover onClick={() => setDetails1(!details1)}>
              <RowBetween>
                <RowFixed>
                  <TokenLogo address={token1?.address || ''} />
                  <TYPE.black marginLeft="10px">
                    {token1?.name} ({token1?.symbol})
                  </TYPE.black>
                </RowFixed>
                <RowFixed>
                  <TYPE.black>{balance1?.toSignificant(6)}</TYPE.black>
                  {details1 ? (
                    <ChevronUp size="20" style={{ marginLeft: '10px' }} color="black" />
                  ) : (
                    <ChevronDown size="20" style={{ marginLeft: '10px' }} color="black" />
                  )}
                </RowFixed>
              </RowBetween>
              {import0 && <TYPE.yellow style={{ paddingLeft: '32px' }}>Token imported by user</TYPE.yellow>}
            </Hover>
          )}
          {details1 && (
            <AutoColumn gap="sm" style={{ marginTop: '2px', marginBottom: '6px' }}>
              <RowFixed>
                <TYPE.blue style={{ paddingLeft: '32px' }}>Copy token address</TYPE.blue>
                <Copy toCopy={token1?.address} />
              </RowFixed>
              <Link href={getEtherscanLink(chainId, token1?.address, 'address')} style={{ paddingLeft: '32px' }}>
                View on etherscan
              </Link>
            </AutoColumn>
          )}
        </AutoColumn>
      </GreyCard>
    </AutoColumn>
  )
}
