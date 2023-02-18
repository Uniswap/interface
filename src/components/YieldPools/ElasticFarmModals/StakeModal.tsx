import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { StakeParam, useElasticFarms, useFarmAction } from 'state/farms/elastic/hooks'
import { NFTPosition } from 'state/farms/elastic/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { StyledInternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'

import { ModalContentWrapper, TableHeader, TableRow, Title } from './styled'

const generateCommonCSS = (isUnstake: boolean) => {
  return css`
    ${isUnstake
      ? 'grid-template-columns: 18px 120px repeat(2, 1fr);'
      : 'grid-template-columns: 18px 120px repeat(3, 1fr);'}
    ${({ theme }) => theme.mediaWidth.upToSmall`
        grid-template-columns: 18px 120px 1fr;
      `}
  `
}

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.text};
  &:hover {
    transform: rotate(180deg);
  }
`

const ScrollContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 90px;

  overflow-y: auto;
  overflow-x: hidden;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
    border-radius: 999px;
  }
`

const StakeTableHeader = styled(TableHeader)<{ isUnstake: boolean }>`
  ${({ isUnstake }) => generateCommonCSS(isUnstake)}
`

const StakeTableRow = styled(TableRow)<{ isUnstake: boolean }>`
  ${({ isUnstake }) => generateCommonCSS(isUnstake)}
`

export type ExplicitNFT = {
  available: NFTPosition
  staked: NFTPosition
  poolAddress: string
}

const PositionRow = ({
  position,
  onChange,
  selected,
  type,
}: {
  selected: boolean
  position: ExplicitNFT
  onChange: (value: boolean) => void
  type: 'stake' | 'unstake'
}) => {
  const above768 = useMedia('(min-width: 768px)')

  const usdPrices = useTokenPrices([position.available.pool.token0.address, position.available.pool.token1.address])

  const outOfRange =
    position.available.pool.tickCurrent < position.available.tickLower ||
    position.available.pool.tickCurrent >= position.available.tickUpper

  const token0Price = usdPrices[position.available.pool.token0.address] || 0
  const token1Price = usdPrices[position.available.pool.token1.address] || 0

  const availableUSD =
    token0Price * parseFloat(position.available.amount0.toExact() || '0') +
    token1Price * parseFloat(position.available.amount1.toExact() || '0')

  const usd =
    token0Price * parseFloat(position.staked.amount0.toExact() || '0') +
    token1Price * parseFloat(position.staked.amount1.toExact() || '0')

  return (
    <StakeTableRow isUnstake={type === 'unstake'}>
      <Checkbox
        onChange={e => {
          onChange(e.currentTarget.checked)
        }}
        checked={selected}
      />
      {above768 ? (
        <Flex alignItems="center">
          <Text>{position.available.nftId.toString()}</Text>
        </Flex>
      ) : (
        <Flex alignItems="center">
          <Text marginRight="4px">{position.available.nftId.toString()}</Text>
          <DoubleCurrencyLogo
            currency0={position.available.pool.token0}
            currency1={position.available.pool.token1}
            size={16}
          />
          <RangeBadge removed={false} inRange={!outOfRange} hideText />
        </Flex>
      )}
      {type === 'stake' && (
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center" fontSize="12px">
          {formatDollarAmount(availableUSD)}
          <MouseoverTooltip
            noArrow
            placement="bottom"
            width="fit-content"
            text={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={position.available.amount0.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {position.available.amount0.toSignificant(8)}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={position.available.amount1.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {position.available.amount1.toSignificant(8)}
                  </Text>
                </Flex>
              </>
            }
          >
            <DropdownIcon />
          </MouseoverTooltip>
        </Flex>
      )}
      {(type === 'unstake' || above768) && (
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center" fontSize="12px">
          {formatDollarAmount(usd)}
          <MouseoverTooltip
            noArrow
            placement="bottom"
            width="fit-content"
            text={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={position.available.amount0.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {position.staked.amount0.toSignificant(8)}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={position.available.amount1.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {position.staked.amount1.toSignificant(8)}
                  </Text>
                </Flex>
              </>
            }
          >
            <DropdownIcon />
          </MouseoverTooltip>
        </Flex>
      )}

      {above768 && (
        <Flex justifyContent="flex-end">
          <RangeBadge removed={false} inRange={!outOfRange} />
        </Flex>
      )}
    </StakeTableRow>
  )
}

function StakeModal({
  selectedFarmAddress,
  onDismiss,
  poolId,
  poolAddress,
  type,
}: {
  onDismiss: () => void
  selectedFarmAddress: string
  poolId: number
  type: 'stake' | 'unstake'
  poolAddress: string
}) {
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const { chainId, networkInfo } = useActiveWeb3React()

  const { farms, userFarmInfo } = useElasticFarms()
  const selectedFarm = farms?.find(farm => farm.id.toLowerCase() === selectedFarmAddress.toLowerCase())

  const { stake, unstake } = useFarmAction(selectedFarmAddress)

  const selectedPool = selectedFarm?.pools.find(pool => Number(pool.pid) === Number(poolId))

  const { token0, token1 } = selectedPool || {}

  const eligibleNfts: ExplicitNFT[] = useMemo(() => {
    if (!isEVM(chainId)) return []
    const joinedPositions = userFarmInfo?.[selectedFarmAddress]?.joinedPositions?.[poolId] || []
    const depositedPositions =
      userFarmInfo?.[selectedFarmAddress].depositedPositions.filter(pos => {
        return (
          selectedPool?.poolAddress.toLowerCase() ===
          computePoolAddress({
            factoryAddress: NETWORKS_INFO[chainId].elastic.coreFactory,
            tokenA: pos.pool.token0,
            tokenB: pos.pool.token1,
            fee: pos.pool.fee,
            initCodeHashManualOverride: NETWORKS_INFO[chainId].elastic.initCodeHash,
          }).toLowerCase()
        )
      }) || []

    return depositedPositions
      .map(item => {
        const stakedLiquidity = BigNumber.from(
          joinedPositions.find(pos => pos.nftId.toString() === item.nftId.toString())?.liquidity.toString() || 0,
        )
        const availableLiquidity = BigNumber.from(item.liquidity.toString()).sub(stakedLiquidity)
        return {
          available: new NFTPosition({
            nftId: item.nftId,
            pool: item.pool,
            liquidity: availableLiquidity.toString(),
            tickLower: item.tickLower,
            tickUpper: item.tickUpper,
          }),
          poolAddress,
          staked: new NFTPosition({
            nftId: item.nftId,
            pool: item.pool,
            liquidity: stakedLiquidity.toString(),
            tickLower: item.tickLower,
            tickUpper: item.tickUpper,
          }),
        }
      })
      .filter(item => {
        if (type === 'stake') {
          return BigNumber.from(item.available.liquidity.toString()).gt(BigNumber.from(0))
        }
        return BigNumber.from(item.staked.liquidity.toString()).gt(BigNumber.from(0))
      })
  }, [type, selectedPool, chainId, poolId, poolAddress, selectedFarmAddress, userFarmInfo])

  const [selectedNFTs, setSeletedNFTs] = useState<ExplicitNFT[]>([])
  const { mixpanelHandler } = useMixpanel()
  useEffect(() => {
    if (!checkboxGroupRef.current) return
    if (selectedNFTs.length === 0) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = false
    } else if (selectedNFTs.length > 0 && eligibleNfts?.length && selectedNFTs.length < eligibleNfts?.length) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = true
    } else {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
    }
  }, [selectedNFTs.length, eligibleNfts])

  const handleClick = async () => {
    const params: StakeParam[] = selectedNFTs.map(e => ({
      nftId: e.available.nftId,
      position: e.available,
      poolAddress: e.poolAddress,
      stakedLiquidity: e.staked.liquidity.toString(),
    }))
    if (type === 'stake') {
      const txhash = await stake(BigNumber.from(poolId), params)
      if (txhash) {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_STAKE_LIQUIDITY_COMPLETED, {
          token_1: token0?.symbol,
          token_2: token1?.symbol,
        })
      }
    } else {
      const txhash = await unstake(BigNumber.from(poolId), params)
      if (txhash) {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_UNSTAKE_LIQUIDITY_COMPLETED, {
          token_1: token0?.symbol,
          token_2: token1?.symbol,
        })
      }
    }
    onDismiss()
  }

  const above768 = useMedia('(min-width: 768px)')

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} maxHeight={80} maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title display="flex">
            <DoubleCurrencyLogo size={24} currency0={token0} currency1={token1} />
            {type === 'stake' ? <Trans>Stake your liquidity</Trans> : <Trans>Unstake your liquidity</Trans>}
          </Title>

          <Flex sx={{ gap: '12px' }}>
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <Text fontSize="12px" marginTop="20px" color={theme.subText}>
          {type === 'stake' ? (
            <Trans>
              Stake your deposited liquidity positions (NFT tokens) into the farms to start earning rewards. Only your
              in-range positions will earn rewards
            </Trans>
          ) : (
            <Trans>
              Unstake your liquidity positions (NFT tokens) from the farm. You will no longer earn rewards on these
              positions once unstaked
            </Trans>
          )}
        </Text>

        {!eligibleNfts.length ? (
          type === 'stake' ? (
            <Flex
              sx={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
              fontSize={14}
              color={theme.subText}
              padding="16px"
              marginTop="20px"
            >
              <Info size="48px" />
              <Text marginTop="16px" textAlign="center" lineHeight={1.5}>
                <Trans>
                  You haven&apos;t deposited any liquidity positions (NFT tokens) for this farming pair yet.
                  <br />
                  <br />
                  Add liquidity to this pool first in our{' '}
                  <StyledInternalLink to={`${APP_PATHS.POOLS}/${networkInfo.route}`}>Pools</StyledInternalLink> page. If
                  you&apos;ve done that, deposit your liquidity position (NFT tokens) before you stake
                </Trans>
              </Text>
            </Flex>
          ) : (
            <Text fontSize={14} color={theme.subText} textAlign="center" padding="16px" marginTop="20px">
              <Trans>You don&apos;t have any available position, Please deposit and stake first</Trans>
            </Text>
          )
        ) : (
          <>
            <StakeTableHeader isUnstake={type === 'unstake'}>
              <Checkbox
                ref={checkboxGroupRef}
                onChange={e => {
                  if (e.currentTarget.checked) {
                    setSeletedNFTs(eligibleNfts || [])
                  } else {
                    setSeletedNFTs([])
                  }
                }}
              />
              <Text textAlign="left">{above768 ? 'ID' : 'ID | Token | Status'}</Text>
              {type === 'stake' && (
                <Text textAlign={'right'}>
                  <Trans>Available Balance</Trans>
                </Text>
              )}
              {(type === 'unstake' || above768) && (
                <Text textAlign={'right'}>
                  <Trans>Staked Balance</Trans>
                </Text>
              )}
              {above768 && (
                <Text textAlign="right">
                  <Trans>Status</Trans>
                </Text>
              )}
            </StakeTableHeader>

            <ScrollContainer>
              {eligibleNfts.map(pos => (
                <PositionRow
                  type={type}
                  selected={selectedNFTs
                    .map(item => item.available.nftId.toString())
                    .includes(pos.available.nftId.toString())}
                  key={pos.available.nftId.toString()}
                  position={pos}
                  onChange={(selected: boolean) => {
                    if (selected) setSeletedNFTs(prev => [...prev, pos])
                    else {
                      setSeletedNFTs(prev =>
                        prev.filter(item => item.available.nftId.toString() !== pos.available.nftId.toString()),
                      )
                    }
                  }}
                />
              ))}
            </ScrollContainer>

            <Flex justifyContent="space-between" marginTop="24px">
              <div></div>
              <ButtonPrimary
                fontSize="14px"
                padding="10px 24px"
                width="fit-content"
                onClick={handleClick}
                disabled={!selectedNFTs.length}
              >
                {type === 'stake' ? <Trans>Stake Selected</Trans> : <Trans>Unstake Selected</Trans>}
              </ButtonPrimary>
            </Flex>
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  )
}

export default StakeModal
