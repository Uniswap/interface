import React, { useState } from 'react'

import TokenLogo from '../TokenLogo'
import { TYPE } from '../../theme'
import { Text } from 'rebass'

import { Hover } from '../../theme'
import { GreyCard } from '../Card'
import { AutoColumn } from '../Column'
import { RowBetween, AutoRow } from '../Row'
import { Copy as CopyIcon, BarChart2, Info, Share, ChevronDown, ChevronUp, Plus } from 'react-feather'
import DoubleLogo from '../DoubleLogo'
import { ButtonSecondary, ButtonGray } from '../Button'
import { Token } from '@uniswap/sdk'

interface BalanceCardProps {
  token0: Token
  balance0: boolean
  import0: boolean
  token1: Token
  balance1: boolean
  import1: boolean
}

export default function BalanceCard({ token0, balance0, import0, token1, balance1, import1 }: BalanceCardProps) {
  const [showInfo, setshowInfo] = useState(false)

  return (
    <AutoRow
      gap="lg"
      justify={'space-between'}
      style={{
        minWidth: '200px',
        maxWidth: '355px',
        flexWrap: 'nowrap',
        alignItems: 'flex-end',
        zIndex: 99
      }}
    >
      <AutoColumn style={{ width: '100%', padding: '12px' }}>
        {!showInfo ? (
          <Hover>
            <GreyCard padding="16px 20px">
              <RowBetween onClick={() => setshowInfo(true)} padding={' 0'}>
                <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
                  Show selection details
                </Text>
                <ChevronDown color={'#565A69'} />
              </RowBetween>
            </GreyCard>
          </Hover>
        ) : (
          <Hover>
            <GreyCard padding="px 20px" style={{ marginTop: '0' }}>
              <RowBetween onClick={() => setshowInfo(false)} padding={'0px'}>
                <Text fontSize={16} color="#565A69" fontWeight={500} style={{ userSelect: 'none' }}>
                  Hide selection details
                </Text>
                <ChevronUp color="#565A69" />
              </RowBetween>
            </GreyCard>
          </Hover>
        )}
        {showInfo && (
          <AutoColumn gap="md" style={{ marginTop: '1rem' }}>
            {token0 && balance0 && (
              // <Hover onClick={() => setDetails0(!details0)}>
              <>
                <GreyCard padding={'1rem'}>
                  <RowBetween>
                    <TYPE.body fontWeight={500}>
                      {token0?.name} ({token0?.symbol})
                    </TYPE.body>
                    <TokenLogo size={'20px'} address={token0?.address || ''} />
                  </RowBetween>
                  {import0 && <TYPE.yellow style={{ paddingLeft: '0' }}>Token imported by user</TYPE.yellow>}

                  <AutoRow gap="sm" justify="flex-start" style={{ marginTop: '1rem' }}>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <Info size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Info
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <BarChart2 size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Charts
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <CopyIcon size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Copy Address
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                  </AutoRow>
                </GreyCard>
              </>
            )}

            {token1 && balance1 && (
              // <Hover onClick={() => setDetails1(!details1)}>
              <>
                <GreyCard padding={'1rem'}>
                  <RowBetween>
                    <TYPE.body fontWeight={500}>
                      {token1?.name} ({token1?.symbol})
                    </TYPE.body>
                    <TokenLogo size={'20px'} address={token1?.address || ''} />
                  </RowBetween>
                  {import1 && <TYPE.yellow style={{ paddingLeft: '0' }}>Token imported by user</TYPE.yellow>}

                  <AutoRow gap="sm" justify="flex-start" style={{ marginTop: '1rem' }}>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <Info size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Info
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <BarChart2 size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Charts
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                    <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                      <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                        <CopyIcon size={14} />
                        <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                          Copy Address
                        </Text>
                      </AutoRow>
                    </ButtonGray>
                  </AutoRow>
                </GreyCard>
              </>
            )}

            <GreyCard padding={'1rem'}>
              <RowBetween>
                <TYPE.body fontWeight={500}>
                  {token0?.symbol}:{token1?.symbol}
                </TYPE.body>
                <DoubleLogo a0={token0?.address || ''} a1={token1?.address || ''} margin={true} size={20} />
              </RowBetween>
              {import1 && <TYPE.yellow style={{ paddingLeft: '32px' }}>Token imported by user</TYPE.yellow>}

              <AutoRow gap="sm" justify="flex-start" style={{ marginTop: '1rem' }}>
                <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                  <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                    <Info size={14} />
                    <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                      Info
                    </Text>
                  </AutoRow>
                </ButtonGray>
                <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                  <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                    <BarChart2 size={14} />
                    <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                      Charts
                    </Text>
                  </AutoRow>
                </ButtonGray>
                <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                  <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                    <CopyIcon size={14} />
                    <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                      Copy Address
                    </Text>
                  </AutoRow>
                </ButtonGray>
                <ButtonGray padding={'2px'} width={'auto'} style={{ margin: '2px' }}>
                  <AutoRow gap="sm" justify="space-between" padding={'0 4px'}>
                    <Plus size={14} />
                    <Text fontWeight={500} fontSize={14} style={{ marginLeft: '6px' }}>
                      Add Liquidity
                    </Text>
                  </AutoRow>
                </ButtonGray>
              </AutoRow>
            </GreyCard>
          </AutoColumn>
        )}
      </AutoColumn>
      <AutoRow
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '132px',
          width: 'fit-content'
        }}
      >
        {token1 && (
          <ButtonSecondary
            style={{
              padding: ' 8px',
              marginLeft: '8px',
              width: 'fit-content'
            }}
          >
            <Share size={16} style={{ marginRight: '8px' }} />
            Share
          </ButtonSecondary>
        )}
      </AutoRow>
    </AutoRow>
  )
}
