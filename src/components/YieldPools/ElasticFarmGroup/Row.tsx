import { ChainId, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { useEffect, useState } from 'react'
import { Minus, Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import { MoneyBag, Swap2 as SwapIcon } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { TOBE_EXTENDED_FARMING_POOLS } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useProMMFarmContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { FarmingPool, NFTPosition } from 'state/farms/elastic/types'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { APRTooltipContent } from '../FarmingPoolAPRCell'
import { useSharePoolContext } from '../SharePoolContext'
import { ProMMFarmTableRow } from '../styleds'
import FarmCard from './FarmCard'
import FeeTarget from './FeeTarget'
import PositionDetail from './PostionDetail'
import { ButtonColorScheme, MinimalActionButton } from './buttons'
import { FeeTag, NFTListWrapper, RowWrapper } from './styleds'

export interface Pool extends FarmingPool {
  tvl: number
  poolAPR: number
  farmAPR: number
  depositedUsd: number
  stakedUsd: number
}

const Row = ({
  isApprovedForAll,
  fairlaunchAddress,
  pool: farmingPool,
  onOpenModal,
  onHarvest,
  isUserAffectedByFarmIssue,
  tokenPrices,
}: {
  isUserAffectedByFarmIssue: boolean
  isApprovedForAll: boolean
  fairlaunchAddress: string
  pool: Pool
  onOpenModal: (modalType: 'deposit' | 'withdraw' | 'stake' | 'unstake', pool?: FarmingPool) => void
  onHarvest: () => void
  tokenPrices: { [key: string]: number }
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const [viewMode] = useViewMode()
  const above1000 = useMedia('(min-width: 1000px)')

  const [isRevertPrice, setIsRevertPrice] = useState(false)
  const { userFarmInfo } = useElasticFarms()
  const joinedPositions = userFarmInfo?.[fairlaunchAddress]?.joinedPositions[farmingPool.pid] || []
  const depositedPositions =
    userFarmInfo?.[fairlaunchAddress]?.depositedPositions.filter(pos => {
      return (
        farmingPool.poolAddress.toLowerCase() ===
        computePoolAddress({
          factoryAddress: NETWORKS_INFO[isEVM(chainId) ? chainId : ChainId.MAINNET].elastic.coreFactory,
          tokenA: pos.pool.token0,
          tokenB: pos.pool.token1,
          fee: pos.pool.fee,
          initCodeHashManualOverride: NETWORKS_INFO[isEVM(chainId) ? chainId : ChainId.MAINNET].elastic.initCodeHash,
        }).toLowerCase()
      )
    }) || []

  const rewardPendings =
    userFarmInfo?.[fairlaunchAddress]?.rewardPendings[farmingPool.pid] ||
    farmingPool.rewardTokens.map(token => CurrencyAmount.fromRawAmount(token, 0))

  const rewardValue = rewardPendings.reduce(
    (acc, cur) => acc + (tokenPrices[cur.currency.wrapped.address] || 0) * +cur.toExact(),
    0,
  )

  const contract = useProMMFarmContract(fairlaunchAddress)
  const [targetPercent, setTargetPercent] = useState('')
  const [targetPercentByNFT, setTargetPercentByNFT] = useState<{ [key: string]: string }>({})
  const [rowOpen, setRowOpen] = useState(false)

  useEffect(() => {
    const getFeeTargetInfo = async () => {
      if (!contract || farmingPool.feeTarget === '0') return
      const userJoinedPos = userFarmInfo?.[fairlaunchAddress].joinedPositions[farmingPool.pid] || []

      if (!userJoinedPos.length) {
        setTargetPercent('')
        return
      }

      const res = await Promise.all(
        userJoinedPos.map(async pos => {
          const res = await contract.getRewardCalculationData(pos.nftId, farmingPool.pid)
          return new Fraction(res.vestingVolume.toString(), BigNumber.from(1e12).toString())
        }),
      )

      const feeTargetByNFT = userJoinedPos.reduce((acc, cur, index) => {
        acc[cur.nftId.toString()] = res[index].multiply(100).toFixed(2)
        return acc
      }, {} as { [key: string]: string })
      setTargetPercentByNFT(feeTargetByNFT)

      const totalLiquidity =
        userJoinedPos.reduce((acc, cur) => acc.add(cur.liquidity.toString()), BigNumber.from(0)) || BigNumber.from(0)

      const targetLiqid = userJoinedPos.reduce(
        (acc, cur, index) => acc.add(res[index].multiply(cur.liquidity.toString())),
        new Fraction(0, 1),
      )

      if (totalLiquidity.gt(0)) {
        const t = targetLiqid.multiply(100).divide(totalLiquidity.toString())
        setTargetPercent(t.toFixed(2))
      }
    }

    getFeeTargetInfo()
  }, [contract, farmingPool.feeTarget, fairlaunchAddress, farmingPool.pid, userFarmInfo])

  const canStake =
    farmingPool.endTime > currentTimestamp &&
    depositedPositions.some(pos => {
      const stakedPos = joinedPositions.find(j => j.nftId.toString() === pos.nftId.toString())
      return !stakedPos
        ? true
        : BigNumber.from(pos.liquidity.toString()).gt(BigNumber.from(stakedPos.liquidity.toString()))
    })

  const canHarvest = rewardPendings.some(amount => amount.greaterThan(0))

  const canUnstake = !!joinedPositions.length
  const isFarmStarted = farmingPool.startTime <= currentTimestamp

  const setSharePoolAddress = useSharePoolContext()

  const amountCanStaked = farmingPool.endTime < currentTimestamp ? 0 : farmingPool.depositedUsd - farmingPool.stakedUsd

  const renderStakeButton = () => {
    if (isUserAffectedByFarmIssue) {
      return (
        <MouseoverTooltipDesktopOnly
          text={t`This farm is currently under maintenance. You can deposit your liquidity into the new farms instead. Your withdrawals are not affected.`}
          placement="top"
          width="300px"
        >
          <MinimalActionButton
            style={{
              cursor: 'not-allowed',
              backgroundColor: theme.buttonGray,
              opacity: 0.4,
            }}
          >
            <Plus size={16} />
          </MinimalActionButton>
        </MouseoverTooltipDesktopOnly>
      )
    }

    if (!isApprovedForAll || !canStake) {
      return (
        <MinimalActionButton disabled>
          <Plus size={16} />
        </MinimalActionButton>
      )
    }

    if (!isFarmStarted) {
      return (
        <MouseoverTooltipDesktopOnly text={t`Farm has not started`} placement="top" width="fit-content">
          <MinimalActionButton
            style={{
              cursor: 'not-allowed',
              backgroundColor: theme.buttonGray,
              color: theme.border,
            }}
          >
            <Plus size={16} />
          </MinimalActionButton>
        </MouseoverTooltipDesktopOnly>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={t`Stake your liquidity positions (i.e. your NFT tokens) into the farm to start earning rewards`}
        placement="top"
        width="300px"
      >
        <MinimalActionButton onClick={() => onOpenModal('stake', farmingPool)}>
          <Plus size={16} />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderUnstakeButton = () => {
    if (!canUnstake) {
      return (
        <MinimalActionButton colorScheme={ButtonColorScheme.Red} disabled={!canUnstake}>
          <Minus size={16} />
        </MinimalActionButton>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={t`Unstake your liquidity positions (i.e. your NFT tokens) from the farm`}
        placement="top"
        width="300px"
      >
        <MinimalActionButton colorScheme={ButtonColorScheme.Red} onClick={() => onOpenModal('unstake', farmingPool)}>
          <Minus size={16} />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderHarvestButton = () => {
    if (!canHarvest) {
      return (
        <MinimalActionButton colorScheme={ButtonColorScheme.Gray} disabled>
          <Harvest />
        </MinimalActionButton>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly text={t`Harvest`} placement="top" width="fit-content">
        <MinimalActionButton colorScheme={ButtonColorScheme.APR} onClick={onHarvest}>
          <Harvest />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const representedPostion = depositedPositions?.[0] as NFTPosition | undefined
  const price =
    representedPostion &&
    (isRevertPrice
      ? representedPostion.pool.priceOf(representedPostion.pool.token1)
      : representedPostion.pool.priceOf(representedPostion.pool.token0))

  if (viewMode === VIEW_MODE.GRID || !above1000) {
    return (
      <FarmCard
        pool={farmingPool}
        rewardValue={rewardValue}
        rewardPendings={rewardPendings}
        onHarvest={onHarvest}
        onStake={() => onOpenModal('stake', farmingPool)}
        disableStake={!isApprovedForAll || !canStake || !isFarmStarted}
        onUnstake={() => onOpenModal('unstake', farmingPool)}
        disableUnstake={!canUnstake}
        farmAddress={fairlaunchAddress}
        tokenPrices={tokenPrices}
        targetPercent={targetPercent}
        targetPercentByNFT={targetPercentByNFT}
        depositedPositions={depositedPositions}
      />
    )
  }

  return (
    <RowWrapper isOpen={rowOpen && !!depositedPositions.length}>
      <ProMMFarmTableRow isOpen={rowOpen && !!depositedPositions.length}>
        <div>
          <Flex alignItems="center">
            <DoubleCurrencyLogo currency0={farmingPool.token0} currency1={farmingPool.token1} />
            <Link
              to={`${APP_PATHS.ELASTIC_CREATE_POOL}/${
                farmingPool.token0.isNative ? farmingPool.token0.symbol : farmingPool.token0.address
              }/${farmingPool.token1.isNative ? farmingPool.token1.symbol : farmingPool.token1.address}/${
                farmingPool.pool.fee
              }`}
              style={{
                textDecoration: 'none',
              }}
            >
              <Text fontSize={14} fontWeight={500}>
                {farmingPool.token0.symbol} - {farmingPool.token1.symbol}
              </Text>
            </Link>

            <FeeTag>FEE {(farmingPool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</FeeTag>
          </Flex>

          <Flex
            marginTop="0.5rem"
            alignItems="center"
            sx={{ gap: '3px' }}
            fontSize="12px"
            color={theme.subText}
            width="max-content"
            fontWeight="500"
          >
            <Flex alignItems="center" sx={{ gap: '4px' }}>
              <CopyHelper toCopy={farmingPool.poolAddress} />
              <Text>{shortenAddress(chainId, farmingPool.poolAddress, 2)}</Text>
            </Flex>

            <Flex
              marginLeft="12px"
              onClick={() => {
                setSharePoolAddress(farmingPool.poolAddress)
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
        </div>

        <Text textAlign="left">{formatDollarAmount(farmingPool.tvl)}</Text>
        <Flex
          alignItems="center"
          justifyContent="flex-start"
          color={theme.apr}
          sx={{
            gap: '4px',
          }}
        >
          {(farmingPool.farmAPR + farmingPool.poolAPR).toFixed(2)}%
          <MouseoverTooltip
            width="fit-content"
            placement="right"
            text={<APRTooltipContent farmAPR={farmingPool.farmAPR} poolAPR={farmingPool.poolAPR} />}
          >
            <MoneyBag size={16} color={theme.apr} />
          </MouseoverTooltip>
        </Flex>

        <Flex flexDirection="column" alignItems="flex-start" justifyContent="center" sx={{ gap: '8px' }}>
          {farmingPool.startTime > currentTimestamp ? (
            <>
              <Text fontSize="12px" color={theme.warning}>
                <Trans>New phase will start in</Trans>
              </Text>
              <Text color={theme.warning}>{getFormattedTimeFromSecond(farmingPool.startTime - currentTimestamp)}</Text>
            </>
          ) : farmingPool.endTime > currentTimestamp ? (
            <>
              <Text color={theme.subText} fontSize="12px">
                <Trans>Current phase will end in</Trans>
              </Text>
              {getFormattedTimeFromSecond(farmingPool.endTime - currentTimestamp)}
            </>
          ) : TOBE_EXTENDED_FARMING_POOLS.includes(farmingPool.poolAddress.toLowerCase()) ? (
            <Trans>To be extended soon</Trans>
          ) : (
            <>
              <Text color={theme.subText} fontSize="12px">
                <Trans>Ended at</Trans>
              </Text>
              {dayjs(farmingPool.endTime * 1000).format('DD-MM-YYYY HH:mm')}
            </>
          )}
        </Flex>

        <div>
          {amountCanStaked ? (
            <Flex justifyContent="flex-start" color={theme.warning}>
              {formatDollarAmount(farmingPool.depositedUsd)}
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
                      Staked: {formatDollarAmount(farmingPool.stakedUsd)}
                    </Text>
                    <Text as="span" color={theme.warning}>
                      Not staked: {formatDollarAmount(amountCanStaked)}
                    </Text>
                  </Flex>
                }
              />
            </Flex>
          ) : (
            <Flex justifyContent="flex-start" color={theme.text}>
              {farmingPool.depositedUsd ? formatDollarAmount(farmingPool.depositedUsd) : '--'}
            </Flex>
          )}

          {farmingPool.feeTarget !== '0' && <FeeTarget percent={targetPercent} />}
        </div>

        <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
          {rewardPendings.map((amount, i) => (
            <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
              <HoverInlineText text={amount.toSignificant(6)} maxCharacters={10}></HoverInlineText>
              <MouseoverTooltip placement="top" text={amount.currency.symbol} width="fit-content">
                <CurrencyLogo currency={amount.currency} size="16px" />
              </MouseoverTooltip>
            </Flex>
          ))}
        </Flex>
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
          {renderStakeButton()}
          {renderUnstakeButton()}
          {renderHarvestButton()}
          {!!depositedPositions.length && (
            <MinimalActionButton colorScheme={ButtonColorScheme.Gray} onClick={() => setRowOpen(prev => !prev)}>
              <DropdownSVG
                style={{ transform: `rotate(${!rowOpen ? '0' : '-180deg'})`, transition: 'transform 0.2s' }}
              />
            </MinimalActionButton>
          )}
        </Flex>
      </ProMMFarmTableRow>
      {rowOpen && !!depositedPositions.length && (
        <>
          <Flex fontSize="12px" fontWeight="500" padding="0 16px 12px" sx={{ gap: '4px' }}>
            <Text color={theme.subText}>
              <Trans>Current Price</Trans>:
            </Text>
            <Text fontSize={'12px'} fontWeight="500" style={{ textAlign: 'right' }}>
              {price ? (
                <Trans>
                  {price.toSignificant(10)} {price.quoteCurrency.symbol} per {price.baseCurrency.symbol}
                </Trans>
              ) : (
                '--'
              )}
            </Text>

            <span onClick={() => setIsRevertPrice(prev => !prev)} style={{ marginLeft: '2px', cursor: 'pointer' }}>
              <SwapIcon size={14} />
            </span>
          </Flex>
          <NFTListWrapper>
            {price &&
              depositedPositions.map(item => {
                return (
                  <PositionDetail
                    key={item.nftId.toString()}
                    farmAddress={fairlaunchAddress}
                    pool={farmingPool}
                    price={price}
                    isRevertPrice={isRevertPrice}
                    nftInfo={item}
                    tokenPrices={tokenPrices}
                    targetPercent={targetPercentByNFT[item.nftId.toString()]}
                  />
                )
              })}
          </NFTListWrapper>
        </>
      )}
    </RowWrapper>
  )
}

export default Row
