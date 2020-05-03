import React, { useState } from 'react'

import Copy from '../AccountDetails/Copy'
import TokenLogo from '../TokenLogo'
import { Link } from '../../theme/components'
import { TYPE } from '../../theme'
import { Text } from 'rebass'

import { Hover } from '../../theme'
import { GreyCard } from '../Card'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed, AutoRow } from '../Row'
import { ChevronDown, ChevronUp, Copy as CopyIcon, BarChart2, Info, Plus } from 'react-feather'
import DoubleLogo from '../DoubleLogo'
import { ButtonEmpty } from '../Button'

import { useWeb3React } from '../../hooks'
import { getEtherscanLink } from '../../utils'

export default function BalanceCard({ token0, balance0, import0, token1, balance1, import1 }) {
  const [details0, setDetails0] = useState(true)
  const [details1, setDetails1] = useState(true)
  const [pair0, setPair1] = useState(true)

  const [showAdvanced, setShowAdvanced] = useState(false)

  const { chainId } = useWeb3React()

  return (
    <AutoColumn gap="lg">
      <GreyCard>
        {!showAdvanced ? (
          <Hover>
            <RowBetween onClick={() => setShowAdvanced(true)} padding={' 0'}>
              <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
                Show token and exchange info
              </Text>
              <ChevronDown color={'#565A69'} />
            </RowBetween>
          </Hover>
        ) : (
          <Hover>
            <RowBetween onClick={() => setShowAdvanced(false)} padding={' 0'}>
              <Text fontSize={16} color="#565A69" fontWeight={500} style={{ userSelect: 'none' }}>
                Hide token and exchange info
              </Text>
              <ChevronUp color="#565A69" />
            </RowBetween>
          </Hover>
        )}

        {showAdvanced && (
          <AutoColumn gap="md" style={{ marginTop: '1rem' }}>
            <RowBetween>
              <RowFixed>
                <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20} />
                <Text fontWeight={500} fontSize={16}>
                  {token0?.symbol}:{token1?.symbol}
                </Text>
              </RowFixed>
              <RowFixed></RowFixed>
            </RowBetween>

            {pair0 && (
              // <AutoColumn gap="sm" style={{ marginTop: '2px', marginBottom: '6px' }}>
              //   <RowFixed>
              //     <Copy toCopy={token0?.address}>
              //       <TYPE.blue style={{ paddingLeft: '24px' }}>Copy pair address</TYPE.blue>
              //     </Copy>
              //   </RowFixed>
              //   <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
              //     Add Liquidity ↘
              //   </Link>
              //   <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
              //     View on etherscan ↗
              //   </Link>
              //   <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
              //     View on pool information ↗
              //   </Link>
              // </AutoColumn>
              <AutoRow gap="sm" justify="space-between" style={{ marginTop: '2px', marginBottom: '6px' }}>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Etherscan
                    </Text>
                    <Info size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      View Analytics
                    </Text>
                    <BarChart2 size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Copy Address
                    </Text>
                    <CopyIcon size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty color={'#565A69'} padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Add Liquidity
                    </Text>
                    <Plus size={14} />
                  </AutoRow>
                </ButtonEmpty>
                {/* <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
                  Add
                </Link>
                <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
                  Info
                </Link>
                <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
                  Data
                </Link> */}
              </AutoRow>
            )}

            {token0 && balance0 && (
              // <Hover onClick={() => setDetails0(!details0)}>
              <>
                <RowBetween>
                  <RowFixed>
                    <TokenLogo address={token0?.address || ''} />
                    <TYPE.black marginLeft="10px">
                      {token0?.name} ({token0?.symbol})
                    </TYPE.black>
                  </RowFixed>
                  <RowFixed>
                    {/* <TYPE.black>{balance0?.toSignificant(6)}</TYPE.black> */}
                    {/* {details0 ? (
                      <ChevronUp size="20" style={{ marginLeft: '10px' }} color="black" />
                    ) : (
                      <ChevronDown size="20" style={{ marginLeft: '10px' }} color="black" />
                    )} */}
                  </RowFixed>
                </RowBetween>
                {import0 && <TYPE.yellow style={{ paddingLeft: '32px' }}>Token imported by user</TYPE.yellow>}
              </>
            )}
            {details0 && (
              <AutoRow gap="sm" justify="space-between" style={{ marginTop: '2px', marginBottom: '6px' }}>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Etherscan
                    </Text>
                    <Info size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      View Analytics
                    </Text>
                    <BarChart2 size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Copy Address
                    </Text>
                    <CopyIcon size={14} />
                  </AutoRow>
                </ButtonEmpty>
              </AutoRow>
            )}
            {token1 && balance1 && (
              // <Hover onClick={() => setDetails1(!details1)}>
              <>
                <RowBetween>
                  <RowFixed>
                    <TokenLogo address={token1?.address || ''} />
                    <TYPE.black marginLeft="10px">
                      {token1?.name} ({token1?.symbol})
                    </TYPE.black>
                  </RowFixed>
                  <RowFixed>
                    {/* <TYPE.black>{balance1?.toSignificant(6)}</TYPE.black> */}
                    {/* {details1 ? (
                      <ChevronUp size="20" style={{ marginLeft: '10px' }} color="black" />
                    ) : (
                      <ChevronDown size="20" style={{ marginLeft: '10px' }} color="black" />
                    )} */}
                  </RowFixed>
                </RowBetween>
                {import0 && <TYPE.yellow style={{ paddingLeft: '32px' }}>Token imported by user</TYPE.yellow>}
              </>
            )}
            {details1 && (
              <AutoColumn gap="sm" style={{ marginTop: '2px', marginBottom: '6px' }}>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Etherscan
                    </Text>
                    <Info size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      View Analytics
                    </Text>
                    <BarChart2 size={14} />
                  </AutoRow>
                </ButtonEmpty>
                <ButtonEmpty padding={'8px 12px'} width={'47%'} style={{ margin: '4px' }}>
                  <AutoRow gap="sm" justify="space-between">
                    <Text fontWeight={500} fontSize={14}>
                      Copy Address
                    </Text>
                    <CopyIcon size={14} />
                  </AutoRow>
                </ButtonEmpty>

                {/* <Link href={getEtherscanLink(chainId, token0?.address, 'address')} style={{ paddingLeft: '32px' }}>
                  View on pool information ↗
                </Link> */}
              </AutoColumn>
            )}
          </AutoColumn>
        )}
      </GreyCard>
    </AutoColumn>
  )
}
