import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { BarChart2, ChevronUp, Plus, Share2 } from 'react-feather'
import { Link, useHistory } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as ViewPositionIcon } from 'assets/svg/view_positions.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { MoneyBag } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import FarmingPoolAPRCell, { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { ELASTIC_BASE_FEE_UNIT, PROMM_ANALYTICS_URL } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useToggleEthPowAckModal } from 'state/application/hooks'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useUrlOnEthPowAck } from 'state/pools/hooks'
import { ExternalLink } from 'theme'
import { ElasticPoolDetail } from 'types/pool'
import { isAddressString, shortenAddress } from 'utils'
import { formatDollarAmount } from 'utils/numbers'

interface ListItemProps {
  pair: ElasticPoolDetail[]
  idx: number
  onShared: (id: string) => void
  userPositions: { [key: string]: number }
  noBorderBottom?: boolean
}

const getPrommAnalyticLink = (chainId: ChainId | undefined, poolAddress: string) => {
  if (!chainId) return ''
  return `${PROMM_ANALYTICS_URL[chainId]}/pool/${poolAddress.toLowerCase()}`
}

const TableRow = styled.div<{ isOpen?: boolean; isShowBorderBottom: boolean; hoverable: boolean }>`
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
  const history = useHistory()
  const [, setUrlOnEthPoWAck] = useUrlOnEthPowAck()
  const toggleEthPowAckModal = useToggleEthPowAckModal()

  const allTokens = useAllTokens()

  const token0 =
    allTokens[isAddressString(chainId, pair[0].token0.address)] ||
    new Token(chainId, pair[0].token0.address, pair[0].token0.decimals, pair[0].token0.symbol)
  const token1 =
    allTokens[isAddressString(chainId, pair[0].token1.address)] ||
    new Token(chainId, pair[0].token1.address, pair[0].token1.decimals, pair[0].token1.symbol)

  const isToken0WETH = pair[0].token0.address === WETH[chainId].address.toLowerCase()
  const isToken1WETH = pair[0].token1.address === WETH[chainId].address.toLowerCase()

  const nativeToken = NativeCurrencies[chainId]

  const token0Slug = isToken0WETH ? nativeToken.symbol : pair[0].token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : pair[0].token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : token1.symbol

  const { farms } = useElasticFarms()

  const { mixpanelHandler } = useMixpanel()

  return (
    <>
      {pair.map((pool, index) => {
        const myLiquidity = userPositions[pool.address]
        const hasLiquidity = pool.address in userPositions
        const hoverable = pair.length > 1 && index === 0
        if (pair.length > 1 && index !== 0 && !isOpen) return null

        let fairlaunchAddress = ''
        let pid = -1

        farms?.forEach(farm => {
          const p = farm.pools
            .filter(item => item.endTime > Date.now() / 1000)
            .find(item => item.poolAddress.toLowerCase() === pool.address.toLowerCase())

          if (p) {
            fairlaunchAddress = farm.id
            pid = Number(p.pid)
          }
        })

        const isFarmingPool = !!fairlaunchAddress && pid !== -1

        const renderPoolAPR = () => {
          if (isFarmingPool) {
            if (pool.farmAPR) {
              return (
                <Flex
                  alignItems={'center'}
                  sx={{
                    gap: '4px',
                  }}
                >
                  <Text as="span">{(pool.apr + pool.farmAPR).toFixed(2)}%</Text>
                  <MouseoverTooltip
                    width="fit-content"
                    placement="top"
                    text={<APRTooltipContent farmAPR={pool.farmAPR} poolAPR={pool.apr} />}
                  >
                    <MoneyBag size={16} color={theme.apr} />
                  </MouseoverTooltip>
                </Flex>
              )
            }

            return <FarmingPoolAPRCell poolAPR={pool.apr} fairlaunchAddress={fairlaunchAddress} pid={pid} />
          }

          return (
            <Flex
              alignItems="center"
              paddingRight="20px" // to make all the APR numbers vertically align
            >
              {pool.apr.toFixed(2)}%
            </Flex>
          )
        }

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
                <DoubleCurrencyLogo
                  currency0={isToken0WETH ? nativeToken : token0}
                  currency1={isToken1WETH ? nativeToken : token1}
                />
                <Text fontSize={16} marginTop="8px">
                  {token0Symbol} - {token1Symbol}
                </Text>
              </DataText>
            ) : (
              <DataText />
            )}
            <DataText grid-area="pool" style={{ position: 'relative' }}>
              {isFarmingPool && (
                <Flex
                  sx={{
                    overflow: 'hidden',
                    borderTopLeftRadius: '8px',
                    position: 'absolute',
                    top: '0px',
                    left: '-24px',
                    flexDirection: 'column',
                  }}
                >
                  <MouseoverTooltip placement="top" text={t`Available for yield farming`}>
                    <Link to={`/farms?tab=elastic&type=active&search=${pool.address}`}>
                      <MoneyBag size={16} color={theme.apr} />
                    </Link>
                  </MouseoverTooltip>
                </Flex>
              )}

              <PoolAddressContainer>
                <Text color={theme.text}>{shortenAddress(chainId, pool.address, 3)}</Text>
                <CopyHelper toCopy={pool.address} />
              </PoolAddressContainer>
              <Text color={theme.text3} fontSize={12} marginTop={'8px'}>
                Fee = {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
              </Text>
            </DataText>
            <DataText alignItems="flex-start">{formatDollarAmount(pool.tvlUSD)}</DataText>
            <DataText alignItems="flex-end" color={theme.apr}>
              {renderPoolAPR()}
            </DataText>
            <DataText alignItems="flex-end">{formatDollarAmount(pool.volumeUSDLast24h)}</DataText>
            <DataText alignItems="flex-end">
              {formatDollarAmount(pool.volumeUSDLast24h * (pool.feeTier / ELASTIC_BASE_FEE_UNIT))}
            </DataText>
            <DataText alignItems="flex-end">{myLiquidity ? formatDollarAmount(Number(myLiquidity)) : '-'}</DataText>
            <ButtonWrapper>
              <MouseoverTooltip text={<Trans> Add liquidity </Trans>} placement={'top'} width={'fit-content'}>
                <ButtonEmpty
                  padding="0"
                  style={{
                    background: rgba(theme.primary, 0.2),
                    minWidth: '28px',
                    minHeight: '28px',
                    width: '28px',
                    height: '28px',
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()

                    const url = `/elastic/add/${token0Slug}/${token1Slug}/${pool.feeTier}`
                    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED, {
                      token_1: token0Symbol,
                      token_2: token1Symbol,
                      fee_tier: pool.feeTier / ELASTIC_BASE_FEE_UNIT,
                    })

                    if (chainId === ChainId.ETHW) {
                      setUrlOnEthPoWAck(url)
                      toggleEthPowAckModal()
                    } else {
                      history.push(url)
                    }
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

              <ButtonIcon
                disabled={pair.length === 1}
                style={{
                  transition: 'transform 0.2s',
                  transform: `rotate(${isOpen ? '0' : '180deg'})`,
                  visibility: index === 0 ? 'visible' : 'hidden',
                }}
              >
                <ChevronUp size="16px" color={theme.text} />
              </ButtonIcon>
            </ButtonWrapper>
          </TableRow>
        )
      })}
      {!noBorderBottom && <Divider />}
    </>
  )
}
