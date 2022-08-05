import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { useState } from 'react'
import { BarChart2, ChevronUp, Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import AgriCulture from 'components/Icons/AgriCulture'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ButtonIcon, IconWrapper } from 'pages/Pools/styleds'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { ProMMPoolData } from 'state/prommPools/hooks'
import { ExternalLink } from 'theme'
import { shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

import { ReactComponent as ViewPositionIcon } from '../../assets/svg/view_positions.svg'

interface ListItemProps {
  pair: ProMMPoolData[]
  idx: number
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
  noBorderBottom?: boolean
}

const getPrommAnalyticLink = (chainId: ChainId | undefined, poolAddress: string) => {
  if (!chainId) return ''
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

export const TableRow = styled.div<{ isOpen?: boolean; isShowBorderBottom: boolean; hoverable: boolean }>`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 0.75fr 1fr 1fr 1.2fr 1.5fr;
  padding: 24px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  background-color: ${({ theme, isOpen }) => (isOpen ? rgba(theme.tableHeader, 0.6) : theme.background)};
  position: relative;

  ${({ theme, hoverable }) =>
    hoverable
      ? css`
          :hover {
            background-color: ${theme.tableHeader};
            cursor: pointer;
          }
        `
      : ''}

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 86.36%; // 100% - (1.5fr / grid-template-columns)
    border-bottom: ${({ theme, isShowBorderBottom }) =>
      isShowBorderBottom ? `1px solid ${rgba(theme.border, 0.5)}` : 'none'};
  }
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text};
  flex-direction: column;
`

const PoolAddressContainer = styled(Flex)`
  align-items: center;
`

const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export default function ProAmmPoolListItem({ pair, idx, onShared, userPositions, noBorderBottom }: ListItemProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isOpen, setIsOpen] = useState(pair.length > 1 ? idx === 0 : false)

  const token0 = new Token(chainId as ChainId, pair[0].token0.address, pair[0].token0.decimals, pair[0].token0.symbol)
  const token1 = new Token(chainId as ChainId, pair[0].token1.address, pair[0].token1.decimals, pair[0].token1.symbol)

  const { data: farms } = useProMMFarms()

  const { mixpanelHandler } = useMixpanel()
  return (
    <>
      {pair.map((pool, index) => {
        const myLiquidity = userPositions[pool.address]
        const hasLiquidity = pool.address in userPositions
        const hoverable = pair.length > 1 && index === 0
        if (pair.length > 1 && index !== 0 && !isOpen) return null

        const token0Address =
          pool.token0.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token0.address

        const token0Symbol =
          pool.token0.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token0.symbol

        const token1Address =
          pool.token1.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token1.address
        const token1Symbol =
          pool.token1.address === WETH[chainId as ChainId].address.toLowerCase()
            ? nativeOnChain(chainId as ChainId).symbol
            : pool.token1.symbol

        const isFarmingPool = Object.values(farms)
          .flat()
          .filter(item => item.endTime > +new Date() / 1000)
          .map(item => item.poolAddress.toLowerCase())
          .includes(pool.address.toLowerCase())

        return (
          <TableRow
            isOpen={isOpen}
            key={pool.address}
            isShowBorderBottom={isOpen && index !== pair.length - 1}
            hoverable={hoverable}
            onClick={() => {
              hoverable && setIsOpen(prev => !prev)
            }}
          >
            {index === 0 ? (
              <DataText>
                <DoubleCurrencyLogo currency0={token0} currency1={token1} />
                <Text fontSize={16} marginTop="8px">
                  {token0Symbol} - {token1Symbol}
                </Text>
              </DataText>
            ) : (
              <DataText />
            )}

            <DataText grid-area="pool" style={{ position: 'relative' }}>
              {isFarmingPool && (
                <div
                  style={{
                    overflow: 'hidden',
                    borderTopLeftRadius: '8px',
                    position: 'absolute',
                    top: '-3px',
                    left: '-26px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <MouseoverTooltip text={t`Available for yield farming`}>
                    <IconWrapper>
                      <AgriCulture width={14} height={14} color={theme.textReverse} />
                    </IconWrapper>
                  </MouseoverTooltip>
                </div>
              )}

              <PoolAddressContainer>
                <Text color={theme.text}>{shortenAddress(pool.address, 3)}</Text>
                <CopyHelper toCopy={pool.address} />
              </PoolAddressContainer>
              <Text color={theme.text3} fontSize={12} marginTop={'8px'}>
                Fee = {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
              </Text>
            </DataText>
            <DataText alignItems="flex-start">{formatDollarAmount(pool.tvlUSD)}</DataText>
            <DataText alignItems="flex-start" color={theme.apr}>
              {pool.apr.toFixed(2)}%
            </DataText>
            <DataText alignItems="flex-end">{formatDollarAmount(pool.volumeUSD)}</DataText>
            <DataText alignItems="flex-end">
              {formatDollarAmount(pool.volumeUSD * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}
            </DataText>
            <DataText alignItems="flex-end">{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</DataText>
            <ButtonWrapper>
              <MouseoverTooltip text={<Trans> Add liquidity </Trans>} placement={'top'} width={'fit-content'}>
                <ButtonEmpty
                  padding="0"
                  as={Link}
                  to={`/elastic/add/${token0Address}/${token1Address}/${pool.feeTier}`}
                  style={{
                    background: rgba(theme.primary, 0.2),
                    minWidth: '28px',
                    minHeight: '28px',
                    width: '28px',
                    height: '28px',
                  }}
                  onClick={() => {
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED, {
                      token_1: token0Symbol,
                      token_2: token1Symbol,
                      fee_tier: pool.feeTier / ELASTIC_BASE_FEE_UNIT,
                    })
                  }}
                >
                  <Plus size={16} color={theme.primary} />
                </ButtonEmpty>
              </MouseoverTooltip>
              {hasLiquidity && (
                <MouseoverTooltip text={t`View positions`} placement={'top'} width={'fit-content'}>
                  <ButtonIcon as={Link} to={`/myPools?tab=${VERSION.ELASTIC}&search=${pool.address}`}>
                    <ViewPositionIcon />
                  </ButtonIcon>
                </MouseoverTooltip>
              )}

              <MouseoverTooltip text={t`Share this pool`} placement={'top'} width={'fit-content'}>
                <ButtonIcon
                  onClick={e => {
                    e.stopPropagation()
                    onShared(pool.address)
                  }}
                >
                  <Share2 size="14px" color={theme.subText} />
                </ButtonIcon>
              </MouseoverTooltip>
              <ExternalLink href={getPrommAnalyticLink(chainId, pool.address)}>
                <MouseoverTooltip text={t`View analytics`} placement={'top'} width={'fit-content'}>
                  <ButtonIcon
                    onClick={e => {
                      e.stopPropagation()
                    }}
                  >
                    <BarChart2 size="14px" color={theme.subText} />
                  </ButtonIcon>
                </MouseoverTooltip>
              </ExternalLink>

              {index === 0 && (
                <ButtonIcon
                  disabled={pair.length === 1}
                  style={{ transition: 'transform 0.2s', transform: `rotate(${isOpen ? '0' : '180deg'})` }}
                >
                  <ChevronUp size="16px" color={theme.text} />
                </ButtonIcon>
              )}
            </ButtonWrapper>
          </TableRow>
        )
      })}
      {!noBorderBottom && <Divider />}
    </>
  )
}
