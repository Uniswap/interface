import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import Modal from 'components/Modal'
import { VERSION } from 'constants/v2'
import { useToken } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useTokensPrice } from 'state/application/hooks'
import { useFarmAction, useProMMFarms } from 'state/farms/promm/hooks'
import { ProMMFarm, UserPositionFarm } from 'state/farms/promm/types'
import { StyledInternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { Checkbox, ModalContentWrapper, TableHeader, TableRow, Title } from './styled'

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

const StakeTableHeader = styled(TableHeader)<{ isUnstake: boolean }>`
  ${({ isUnstake }) => generateCommonCSS(isUnstake)}
`

const StakeTableRow = styled(TableRow)<{ isUnstake: boolean }>`
  ${({ isUnstake }) => generateCommonCSS(isUnstake)}
`

const PositionRow = ({
  position,
  onChange,
  selected,
  type,
}: {
  selected: boolean
  position: UserPositionFarm
  onChange: (value: boolean) => void
  type: 'stake' | 'unstake'
}) => {
  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    stakedLiquidity,
    tickLower,
    tickUpper,
  } = position
  const above768 = useMedia('(min-width: 768px)')

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokensPrice([token0, token1], VERSION.ELASTIC)

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const positionStake = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: stakedLiquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [pool, tickLower, tickUpper, stakedLiquidity])

  const positionAvailable = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.sub(stakedLiquidity).toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper, stakedLiquidity])

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange =
    positionStake &&
    (positionStake.pool.tickCurrent < position.tickLower || positionStake.pool.tickCurrent >= position.tickUpper)

  const availableUSD =
    (usdPrices?.[0] || 0) * parseFloat(positionAvailable?.amount0.toExact() || '0') +
    (usdPrices?.[1] || 0) * parseFloat(positionAvailable?.amount1.toExact() || '0')

  const usd =
    (usdPrices?.[0] || 0) * parseFloat(positionStake?.amount0.toExact() || '0') +
    (usdPrices?.[1] || 0) * parseFloat(positionStake?.amount1.toExact() || '0')

  return (
    <StakeTableRow isUnstake={type === 'unstake'}>
      <Checkbox
        type="checkbox"
        onChange={e => {
          onChange(e.currentTarget.checked)
        }}
        checked={selected}
      />
      {above768 ? (
        <Flex alignItems="center">
          <Text>{position.tokenId.toString()}</Text>
        </Flex>
      ) : (
        <Flex alignItems="center">
          <Text marginRight="4px">{position.tokenId.toString()}</Text>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />
          <RangeBadge removed={removed} inRange={!outOfRange} hideText />
        </Flex>
      )}
      {type === 'stake' && (
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center" fontSize="12px">
          <HoverDropdown
            placement="right"
            content={formatDollarAmount(availableUSD)}
            dropdownContent={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={positionAvailable?.amount0.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {positionAvailable?.amount0.toSignificant(8)}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={positionAvailable?.amount1.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {positionAvailable?.amount1.toSignificant(8)}
                  </Text>
                </Flex>
              </>
            }
          />
        </Flex>
      )}
      {(type === 'unstake' || above768) && (
        <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center" fontSize="12px">
          <HoverDropdown
            placement="right"
            content={formatDollarAmount(usd)}
            dropdownContent={
              <>
                <Flex alignItems="center">
                  <CurrencyLogo currency={positionStake?.amount0.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {positionStake?.amount0.toSignificant(8)}
                  </Text>
                </Flex>
                <Flex alignItems="center" marginTop="8px">
                  <CurrencyLogo currency={positionStake?.amount1.currency} size="16px" />
                  <Text fontSize={12} marginLeft="4px">
                    {positionStake?.amount1.toSignificant(8)}
                  </Text>
                </Flex>
              </>
            }
          />
        </Flex>
      )}

      {above768 && (
        <Flex justifyContent="flex-end">
          <RangeBadge removed={removed} inRange={!outOfRange} />
        </Flex>
      )}
    </StakeTableRow>
  )
}

function StakeModal({
  selectedFarmAddress,
  onDismiss,
  poolId,
  type,
}: {
  onDismiss: () => void
  selectedFarmAddress: string
  poolId: number
  type: 'stake' | 'unstake'
}) {
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[selectedFarmAddress] as ProMMFarm[]

  const { stake, unstake } = useFarmAction(selectedFarmAddress)

  const selectedPool = selectedFarm.find(pool => pool.pid === poolId) as ProMMFarm

  const token0 = useToken(selectedPool.token0)
  const token1 = useToken(selectedPool.token1)

  const eligibleNfts = useMemo(() => {
    return selectedPool.userDepositedNFTs.filter(item => {
      if (type === 'stake') {
        return item.liquidity.sub(item.stakedLiquidity).gt(BigNumber.from(0))
      }
      return item.stakedLiquidity.gt(BigNumber.from(0))
    })
  }, [type, selectedPool])

  const [selectedNFTs, setSeletedNFTs] = useState<UserPositionFarm[]>([])
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
    if (type === 'stake') {
      const txhash = await stake(
        BigNumber.from(poolId),
        selectedNFTs.map(item => BigNumber.from(item.tokenId)),
        selectedNFTs.map(item => item.liquidity.sub(item.stakedLiquidity)),
      )
      if (txhash) {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_STAKE_LIQUIDITY_COMPLETED, {
          token_1: token0?.symbol,
          token_2: token1?.symbol,
        })
      }
    } else {
      const txhash = await unstake(
        BigNumber.from(poolId),
        selectedNFTs.map(item => BigNumber.from(item.tokenId)),
        selectedNFTs.map(item => item.stakedLiquidity),
      )
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
                  Add liquidity to this pool first in our <StyledInternalLink to="/pools">
                    Pools
                  </StyledInternalLink>{' '}
                  page. If you&apos;ve done that, deposit your liquidity position (NFT tokens) before you stake
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
                type="checkbox"
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

            {eligibleNfts.map((pos: any) => (
              <PositionRow
                type={type}
                selected={selectedNFTs.map(item => item.tokenId.toString()).includes(pos.tokenId.toString())}
                key={pos.tokenId.toString()}
                position={pos}
                onChange={(selected: boolean) => {
                  if (selected) setSeletedNFTs(prev => [...prev, pos])
                  else {
                    setSeletedNFTs(prev => prev.filter(item => item.tokenId.toString() !== pos.tokenId.toString()))
                  }
                }}
              />
            ))}
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
