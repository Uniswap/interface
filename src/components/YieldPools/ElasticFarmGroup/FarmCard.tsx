import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useState } from 'react'
import { Info, Minus, Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropIcon } from 'assets/svg/drop.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import { Swap as SwapIcon } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { TOBE_EXTENDED_FARMING_POOLS } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { FarmingPool, NFTPosition } from 'state/farms/elastic/types'
import { shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { APRTooltipContent } from '../FarmingPoolAPRCell'
import { useSharePoolContext } from '../SharePoolContext'
import FeeTarget from './FeeTarget'
import PositionDetail from './PostionDetail'
import { Button, FeeTag, FlipCard, FlipCardBack, FlipCardFront } from './styleds'

const Range = styled.div<{ inrange?: boolean }>`
  align-self: flex-end;
  align-items: center;
  color: ${({ theme, inrange }) => (inrange ? theme.primary : theme.warning)};
  padding: 3px 4px;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  border-radius: 999px;
  background: ${({ theme, inrange }) => rgba(inrange ? theme.primary : theme.warning, 0.3)};
`

interface Pool extends FarmingPool {
  tvl: number
  poolAPR: number
  farmAPR: number
  depositedUsd: number
  stakedUsd: number
}

type Props = {
  pool: Pool
  rewardPendings: CurrencyAmount<Currency>[]
  depositedPositions: NFTPosition[]
  rewardValue: number
  onHarvest: () => void
  onStake: () => void
  disableStake: boolean
  onUnstake: () => void
  disableUnstake: boolean
  farmAddress: string
  tokenPrices: { [key: string]: number }
  targetPercent: string
  targetPercentByNFT: { [key: string]: string }
}

const FarmCard = ({
  disableUnstake,
  onUnstake,
  disableStake,
  onStake,
  onHarvest,
  pool,
  rewardValue,
  rewardPendings,
  depositedPositions,
  farmAddress,
  tokenPrices,
  targetPercent,
  targetPercentByNFT,
}: Props) => {
  const { chainId } = useActiveWeb3React()
  const [isRevertPrice, setIsRevertPrice] = useState(false)
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const isFarmEnded = pool.endTime < currentTimestamp

  const canHarvest = rewardPendings.some(amount => amount.greaterThan(0))

  const amountCanStaked = isFarmEnded ? 0 : pool.depositedUsd - pool.stakedUsd
  const setSharePoolAddress = useSharePoolContext()
  const [showPosition, setShowPosition] = useState(false)

  const addliquidityElasticPool = `${APP_PATHS.ELASTIC_CREATE_POOL}/${
    pool.token0.isNative ? pool.token0.symbol : pool.token0.address
  }/${pool.token1.isNative ? pool.token1.symbol : pool.token1.address}/${pool.pool.fee}`

  const representedPostion = depositedPositions?.[0] as NFTPosition | undefined
  const price =
    representedPostion &&
    (isRevertPrice
      ? representedPostion.pool.priceOf(representedPostion.pool.token1)
      : representedPostion.pool.priceOf(representedPostion.pool.token0))

  const numberOutRangePos = depositedPositions.filter(
    pos => pos.pool.tickCurrent < pos.tickLower || pos.pool.tickCurrent >= pos.tickUpper,
  ).length

  const numberInRangePos = depositedPositions.filter(
    pos => pos.pool.tickCurrent >= pos.tickLower && pos.pool.tickCurrent < pos.tickUpper,
  ).length
  //TODO namgold/vietnv: remove this hardcode
  const token0Symbol =
    chainId === ChainId.OPTIMISM &&
    pool?.token0?.wrapped?.address.toLowerCase() === '0x4518231a8fdf6ac553b9bbd51bbb86825b583263'.toLowerCase()
      ? 'mKNC'
      : pool.token0.symbol
  const token1Symbol =
    chainId === ChainId.OPTIMISM &&
    pool?.token1?.wrapped?.address.toLowerCase() === '0x4518231a8fdf6ac553b9bbd51bbb86825b583263'.toLowerCase()
      ? 'mKNC'
      : pool.token1.symbol

  return (
    <FlipCard flip={showPosition} joined={!!depositedPositions.length}>
      {!showPosition && (
        <FlipCardFront>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={pool.token0} currency1={pool.token1} size={20} />
              <Link
                to={addliquidityElasticPool}
                style={{
                  textDecoration: 'none',
                }}
              >
                <Text fontSize={16} fontWeight={500}>
                  {token0Symbol} - {token1Symbol}
                </Text>
              </Link>

              <FeeTag style={{ fontSize: '12px' }}>FEE {(pool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
            </Flex>

            <Flex sx={{ gap: '4px' }}>
              {!!numberOutRangePos && (
                <MouseoverTooltip
                  text={
                    <Text fontSize="12px" fontStyle="italic">
                      <Trans>You have {numberOutRangePos} out-of-range position(s)</Trans>
                    </Text>
                  }
                >
                  <Range>
                    {numberOutRangePos} <Info size={12} />
                  </Range>
                </MouseoverTooltip>
              )}

              {!!numberInRangePos && (
                <MouseoverTooltip
                  text={
                    <Text fontSize="12px" fontStyle="italic">
                      <Trans>You have {numberInRangePos} in-range position(s)</Trans>
                    </Text>
                  }
                >
                  <Range inrange>
                    {numberInRangePos} <Info size={12} />
                  </Range>
                </MouseoverTooltip>
              )}
            </Flex>
          </Flex>

          <Flex
            marginTop="0.75rem"
            alignItems="center"
            sx={{ gap: '6px' }}
            fontSize="12px"
            color={theme.subText}
            width="max-content"
            fontWeight="500"
          >
            <Flex alignItems="center" sx={{ gap: '4px' }}>
              <CopyHelper toCopy={pool.poolAddress} />
              <Text>{shortenAddress(chainId, pool.poolAddress, 2)}</Text>
            </Flex>

            <Flex
              marginLeft="12px"
              onClick={() => {
                setSharePoolAddress(pool.poolAddress)
              }}
              sx={{
                cursor: 'pointer',
                gap: '4px',
              }}
              role="button"
              color={theme.subText}
            >
              <Share2 size="14px" color={theme.subText} />
              <Trans>Share</Trans>
            </Flex>
          </Flex>

          <Text
            width="fit-content"
            lineHeight="16px"
            fontSize="12px"
            fontWeight="500"
            color={theme.subText}
            sx={{ borderBottom: `1px dashed ${theme.border}` }}
            marginTop="16px"
          >
            <MouseoverTooltip
              width="fit-content"
              placement="right"
              text={<APRTooltipContent farmAPR={pool.farmAPR} poolAPR={pool.poolAPR} />}
            >
              <Trans>Avg APR</Trans>
            </MouseoverTooltip>
          </Text>

          <Text fontSize="28px" fontWeight="500" color={theme.apr}>
            {(pool.farmAPR + pool.poolAPR).toFixed(2)}%
          </Text>

          <Flex justifyContent="space-between" marginTop="16px" fontSize="12px" fontWeight="500" color={theme.subText}>
            <Text>
              <Trans>Staked TVL</Trans>
            </Text>

            {pool.startTime > currentTimestamp ? (
              <Text color={theme.warning}>
                <Trans>New phase will start in</Trans>
              </Text>
            ) : pool.endTime > currentTimestamp ? (
              <Trans>Current phase will end in</Trans>
            ) : TOBE_EXTENDED_FARMING_POOLS.includes(pool.poolAddress.toLowerCase()) ? (
              <Trans>To be extended soon</Trans>
            ) : (
              <Trans>Ended at</Trans>
            )}
          </Flex>

          <Flex justifyContent="space-between" marginTop="4px" fontSize="16px" fontWeight="500" marginBottom="16px">
            <Text fontWeight="500">{formatDollarAmount(pool.tvl)}</Text>
            {pool.startTime > currentTimestamp ? (
              <Text color={theme.warning}>{getFormattedTimeFromSecond(pool.startTime - currentTimestamp)}</Text>
            ) : pool.endTime > currentTimestamp ? (
              <>{getFormattedTimeFromSecond(pool.endTime - currentTimestamp)}</>
            ) : TOBE_EXTENDED_FARMING_POOLS.includes(pool.poolAddress.toLowerCase()) ? (
              <Trans>To be extended soon</Trans>
            ) : (
              <>{dayjs(pool.endTime * 1000).format('DD-MM-YYYY HH:mm')}</>
            )}
          </Flex>

          <Divider />

          <Flex marginTop="16px" justifyContent="space-between" fontSize="12px" fontWeight="500" color={theme.subText}>
            <Text>
              <Trans>My Deposit</Trans>
            </Text>
            <Text>
              <Trans>My Rewards</Trans>
            </Text>
          </Flex>

          <Flex marginTop="4px" justifyContent="space-between">
            {amountCanStaked ? (
              <Flex justifyContent="flex-start" color={theme.warning} fontWeight="500" fontSize="16px">
                {formatDollarAmount(pool.depositedUsd)}
                <InfoHelper
                  placement="top"
                  color={theme.warning}
                  width={'270px'}
                  text={
                    <Flex
                      sx={{
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '12px',
                        lineHeight: '16px',
                        fontWeight: 400,
                      }}
                    >
                      <Text as="span" color={theme.subText}>
                        <Trans>
                          You still have {formatDollarAmount(amountCanStaked)} in liquidity to stake to earn even more
                          farming rewards
                        </Trans>
                      </Text>
                      <Text as="span" color={theme.text}>
                        Staked: {formatDollarAmount(pool.stakedUsd)}
                      </Text>
                      <Text as="span" color={theme.warning}>
                        Not staked: {formatDollarAmount(amountCanStaked)}
                      </Text>
                    </Flex>
                  }
                />
              </Flex>
            ) : (
              <Flex justifyContent="flex-start" color={theme.text} fontWeight="500" fontSize="16px">
                {pool.depositedUsd ? formatDollarAmount(pool.depositedUsd) : '--'}
              </Flex>
            )}

            <HoverDropdown
              style={{ padding: '0' }}
              content={
                rewardValue ? (
                  <Text fontSize="16px" fontWeight="500" textAlign="right">
                    {formatDollarAmount(rewardValue)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!rewardValue}
              dropdownContent={
                <Flex flexDirection="column" sx={{ gap: '8px' }}>
                  {rewardPendings.map((amount, i) => (
                    <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
                      <CurrencyLogo currency={amount.currency} size="16px" />
                      {amount.toSignificant(6)} {amount.currency.symbol}
                    </Flex>
                  ))}
                </Flex>
              }
            />
          </Flex>

          {pool.feeTarget !== '0' && <FeeTarget percent={targetPercent} style={{ maxWidth: '100%' }} />}

          <Flex marginTop="20px" justifyContent="space-between">
            <Flex sx={{ gap: '12px' }}>
              <Button color={theme.primary} disabled={disableStake} onClick={onStake}>
                <Plus size={16} /> Stake
              </Button>
              <Button color={theme.red} disabled={disableUnstake} onClick={onUnstake}>
                <Minus size={16} /> Unstake
              </Button>
            </Flex>
            <Button color={theme.apr} disabled={!canHarvest} onClick={onHarvest}>
              <Harvest /> Harvest
            </Button>
          </Flex>

          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="auto"
            paddingTop="16px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            opacity={!depositedPositions.length ? 0.4 : 1}
            sx={{ cursor: !depositedPositions.length ? 'not-allowed' : 'pointer' }}
            onClick={() => depositedPositions.length && setShowPosition(prev => !prev)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Positions</Trans>
            </Text>
          </Flex>
        </FlipCardFront>
      )}

      {showPosition && (
        <FlipCardBack>
          <Flex alignItems="center" height="36px">
            <DoubleCurrencyLogo currency0={pool.token0} currency1={pool.token1} size={20} />
            <Link
              to={`${APP_PATHS.ELASTIC_CREATE_POOL}/${
                pool.token0.isNative ? pool.token0.symbol : pool.token0.address
              }/${pool.token1.isNative ? pool.token1.symbol : pool.token1.address}/${pool.pool.fee}`}
              style={{
                textDecoration: 'none',
              }}
            >
              <Text fontSize={16} fontWeight={500}>
                {token0Symbol} - {token1Symbol}
              </Text>
            </Link>

            <FeeTag>FEE {(pool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
          </Flex>

          <Flex justifyContent="space-between" fontSize="12px" fontWeight="500" alignItems="center">
            <Text color={theme.subText}>
              <Trans>Current Price</Trans>:
            </Text>

            <ButtonEmpty
              padding="0"
              as={Link}
              to={`${APP_PATHS.MY_POOLS}`}
              style={{
                width: 'max-content',
                color: theme.subText,
                fontSize: '12px',
                fontWeight: '500',
                gap: '4px',
              }}
            >
              <DropIcon />
              <Trans>My Pools</Trans> ↗
            </ButtonEmpty>
          </Flex>

          <Flex marginTop="4px" alignItems="center">
            {price && (
              <Text fontSize={'12px'} fontWeight="500" style={{ textAlign: 'right' }}>
                <Trans>
                  {price.toSignificant(10)} {price.quoteCurrency.symbol} per {price.baseCurrency.symbol}
                </Trans>
              </Text>
            )}

            <span
              onClick={() => setIsRevertPrice(prev => !prev)}
              style={{ marginLeft: '2px', cursor: 'pointer', transform: 'rotate(90deg)' }}
            >
              <SwapIcon size={14} />
            </span>
          </Flex>

          <Flex
            maxHeight="200px"
            flex={1}
            marginTop="20px"
            sx={{ overflowY: 'scroll', gap: '12px' }}
            flexDirection="column"
          >
            {price &&
              depositedPositions.map(item => {
                return (
                  <PositionDetail
                    key={item.nftId.toString()}
                    farmAddress={farmAddress}
                    isRevertPrice={isRevertPrice}
                    price={price}
                    pool={pool}
                    nftInfo={item}
                    tokenPrices={tokenPrices}
                    targetPercent={targetPercentByNFT[item.nftId.toString()]}
                  />
                )
              })}
          </Flex>

          <Flex
            justifyContent="center"
            alignItems="center"
            marginTop="auto"
            paddingTop="16px"
            fontSize="12px"
            fontWeight="500"
            role="button"
            color={theme.subText}
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowPosition(prev => !prev)}
          >
            <Text as="span" style={{ transform: 'rotate(90deg)' }}>
              <SwapIcon />
            </Text>
            <Text marginLeft="4px">
              <Trans>View Farm</Trans>
            </Text>
          </Flex>
        </FlipCardBack>
      )}
    </FlipCard>
  )
}

export default FarmCard
