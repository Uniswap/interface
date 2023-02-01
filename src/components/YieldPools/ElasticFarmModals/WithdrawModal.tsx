import { Position, computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useElasticFarms, useFailedNFTs, useFarmAction, usePositionFilter } from 'state/farms/elastic/hooks'
import { UserPositionFarm } from 'state/farms/elastic/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { PositionDetails } from 'types/position'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { Button } from '../ElasticFarmGroup/styleds'
import {
  DropdownIcon,
  ModalContentWrapper,
  Select,
  SelectMenu,
  SelectOption,
  TableHeader,
  TableRow,
  Title,
} from './styled'

const PositionRow = ({
  position,
  onChange,
  selected,
  forced,
  farmAddress,
}: {
  selected: boolean
  position: UserPositionFarm
  onChange: (value: boolean, position: Position | undefined) => void
  forced: boolean
  farmAddress: string
}) => {
  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper } = position

  const { unstake } = useFarmAction(farmAddress)
  const { userFarmInfo } = useElasticFarms()

  const joinedPositions = userFarmInfo?.[farmAddress]?.joinedPositions
  let pid: null | string = null
  if (joinedPositions) {
    Object.keys(joinedPositions).forEach(key => {
      joinedPositions[key].forEach(pos => {
        if (pos.nftId.toString() === position.tokenId.toString()) pid = key
      })
    })
  }

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokenPrices([token0Address, token1Address])

  // construct Position from details returned
  const [, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, feeAmount)

  const positionSDK = useMemo(() => {
    if (pool) {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  const removed = BigNumber.from(position.liquidity.toString()).eq(0)
  const outOfRange =
    positionSDK &&
    (positionSDK.pool.tickCurrent < position.tickLower || positionSDK.pool.tickCurrent >= position.tickUpper)

  const theme = useTheme()

  const usd =
    (usdPrices?.[token0Address] || 0) * parseFloat(positionSDK?.amount0.toExact() || '0') +
    (usdPrices?.[token1Address] || 0) * parseFloat(positionSDK?.amount1.toExact() || '0')

  const above768 = useMedia('(min-width: 768px)')

  const disableCheckbox = (
    <Flex
      width={'17.5px'}
      height="17.5px"
      backgroundColor={theme.disableText}
      sx={{ borderRadius: '2px' }}
      alignItems="center"
      justifyContent="center"
    >
      <X size={14} color="#333" />
    </Flex>
  )

  return (
    <TableRow>
      {forced ? (
        <Checkbox disabled checked />
      ) : !position.stakedLiquidity.gt(BigNumber.from(0)) ? (
        <Checkbox
          onChange={e => {
            onChange(e.currentTarget.checked, positionSDK)
          }}
          checked={selected}
        />
      ) : (
        <MouseoverTooltip text="You will need to unstake this position first before you can withdraw it">
          {disableCheckbox}
        </MouseoverTooltip>
      )}
      {above768 ? (
        <>
          <Flex alignItems="center" sx={{ gap: '4px' }}>
            {/* <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />*/}
            <Text>{position.tokenId.toString()}</Text>
            <RangeBadge removed={removed} inRange={!outOfRange} hideText size={12} />
          </Flex>
          <Text>{formatDollarAmount(usd)}</Text>
          <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
            {positionSDK?.amount0.toSignificant(6)}
            <CurrencyLogo size="16px" currency={currency0} />
          </Flex>

          <Flex justifyContent="flex-end" sx={{ gap: '4px' }} alignItems="center">
            {positionSDK?.amount1.toSignificant(6)}
            <CurrencyLogo size="16px" currency={currency1} />
          </Flex>

          <Flex justifyContent="flex-end">
            <Button
              color={theme.red}
              style={{ height: '28px' }}
              disabled={position.stakedLiquidity.eq(BigNumber.from(0))}
              onClick={() => {
                if (!!pid && positionSDK)
                  unstake(BigNumber.from(pid), [
                    {
                      nftId: position.tokenId,
                      stakedLiquidity: position.stakedLiquidity.toString(),
                      poolAddress: position.poolId,
                      position: positionSDK,
                    },
                  ])
              }}
            >
              <Minus size={16} /> Unstake
            </Button>
          </Flex>
        </>
      ) : (
        <>
          <Flex alignItems="center">
            <Text marginRight="4px">{position.tokenId.toString()}</Text>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />
            <RangeBadge removed={removed} inRange={!outOfRange} hideText />
          </Flex>
          <Flex justifyContent="flex-end">
            <HoverDropdown
              content={<Text>{formatDollarAmount(usd)}</Text>}
              dropdownContent={
                <>
                  <Flex sx={{ gap: '4px' }} alignItems="center">
                    <CurrencyLogo size="16px" currency={currency0} />
                    {positionSDK?.amount0.toSignificant(6)} {positionSDK?.amount0.currency.symbol}
                  </Flex>

                  <Flex sx={{ gap: '4px' }} alignItems="center">
                    <CurrencyLogo size="16px" currency={currency1} />
                    {positionSDK?.amount1.toSignificant(6)} {positionSDK?.amount1.currency.symbol}
                  </Flex>
                </>
              }
            ></HoverDropdown>
          </Flex>
        </>
      )}
    </TableRow>
  )
}

function WithdrawModal({
  selectedFarmAddress,
  onDismiss,
  forced = false,
}: {
  onDismiss: () => void
  selectedFarmAddress: string
  forced?: boolean
}) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')

  const { type: tab = 'active' } = useParsedQueryString<{ type: string }>()

  const checkboxGroupRef = useRef<any>()
  const { farms, userFarmInfo } = useElasticFarms()

  const selectedFarm = farms?.find(farm => farm.id.toLowerCase() === selectedFarmAddress.toLowerCase())

  const poolAddresses =
    selectedFarm?.pools
      .filter(pool => (tab === 'active' ? pool.endTime > +new Date() / 1000 : pool.endTime < +new Date() / 1000))
      .map(pool => pool.poolAddress.toLowerCase()) || []

  const failedNFTs = useFailedNFTs()

  const { depositedPositions = [], joinedPositions = {} } = userFarmInfo?.[selectedFarm?.id || ''] || {}

  const userDepositedNFTs: PositionDetails[] = useMemo(
    () =>
      isEVM(chainId)
        ? depositedPositions.map(pos => {
            const stakedLiquidity = Object.values(joinedPositions)
              .flat()
              .filter(
                p => pos.nftId.toString() === p.nftId.toString() && BigNumber.from(p.liquidity.toString()).gt('0'),
              )?.[0]?.liquidity

            return {
              nonce: BigNumber.from(0),
              poolId: computePoolAddress({
                factoryAddress: NETWORKS_INFO[chainId].elastic.coreFactory,
                tokenA: pos.pool.token0,
                tokenB: pos.pool.token1,
                fee: pos.pool.fee,
                initCodeHashManualOverride: NETWORKS_INFO[chainId].elastic.initCodeHash,
              }),
              feeGrowthInsideLast: BigNumber.from(0),
              operator: '',
              rTokenOwed: BigNumber.from(0),
              fee: pos.pool.fee,
              tokenId: pos.nftId,
              tickLower: pos.tickLower,
              tickUpper: pos.tickUpper,
              liquidity: BigNumber.from(pos.liquidity.toString()),
              token0: pos.amount0.currency.address,
              token1: pos.amount1.currency.address,
              stakedLiquidity: stakedLiquidity ? BigNumber.from(stakedLiquidity.toString()) : BigNumber.from(0),
            }
          })
        : [],
    [chainId, depositedPositions, joinedPositions],
  )

  const { filterOptions, activeFilter, setActiveFilter, eligiblePositions } = usePositionFilter(
    userDepositedNFTs,
    poolAddresses,
  )

  const withDrawableNFTs = useMemo(() => {
    return (eligiblePositions as UserPositionFarm[]).filter(item => item.stakedLiquidity.eq(0))
  }, [eligiblePositions])

  const [selectedNFTs, setSeletedNFTs] = useState<PositionDetails[]>([])
  const mapPositionInfo = useRef<{ [tokenId: string]: Position }>({})

  const { withdraw, emergencyWithdraw } = useFarmAction(selectedFarmAddress)

  useEffect(() => {
    if (!checkboxGroupRef.current) return
    if (forced) {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
      return
    }
    if (selectedNFTs.length === 0) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = false
    } else if (selectedNFTs.length > 0 && withDrawableNFTs?.length && selectedNFTs.length < withDrawableNFTs?.length) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = true
    } else {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
    }
  }, [selectedNFTs.length, withDrawableNFTs, forced])

  const [showMenu, setShowMenu] = useState(false)

  const ref = useRef(null)
  useOnClickOutside(ref, () => setShowMenu(false))
  const { mixpanelHandler } = useMixpanel()

  if (!selectedFarmAddress) return null

  const handleWithdraw = async () => {
    if (forced) {
      await emergencyWithdraw(failedNFTs.map(BigNumber.from))
      onDismiss()
      return
    }

    const txHash = await withdraw(
      selectedNFTs,
      selectedNFTs.map(item => mapPositionInfo.current[item.tokenId.toString()]),
    )
    if (txHash) {
      const finishedPoses = eligiblePositions.filter(pos =>
        selectedNFTs.find(e => e.tokenId.toString() === pos.tokenId.toString()),
      )
      finishedPoses.forEach(pos => {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_WITHDRAW_LIQUIDITY_COMPLETED, {
          token_1: pos.token0,
          token_2: pos.token1,
        })
      })
    }
    onDismiss()
  }

  const filterComponent = (
    <Select role="button" onClick={() => setShowMenu(prev => !prev)}>
      {filterOptions.find(item => item.code === activeFilter)?.value}

      <DropdownIcon rotate={showMenu} />

      {showMenu && (
        <SelectMenu ref={ref}>
          {filterOptions.map(item => (
            <SelectOption
              key={item.code}
              role="button"
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                setActiveFilter(item.code)
                setShowMenu(prev => !prev)
              }}
            >
              {item.value}
            </SelectOption>
          ))}
        </SelectMenu>
      )}
    </Select>
  )

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} width="80vw" maxHeight={80} maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>{forced ? <Trans>Force Withdraw</Trans> : <Trans>Withdraw your liquidity</Trans>}</Title>

          <Flex sx={{ gap: '12px' }}>
            {above768 && !forced && filterComponent}
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <Text fontSize="12px" marginTop="20px" color={theme.subText}>
          {forced ? (
            <Trans>Below is a list of your affected liquidity positions</Trans>
          ) : (
            <Trans>
              You will need to unstake your liquidity positions (NFT tokens) first before withdrawing it back to your
              wallet
            </Trans>
          )}
        </Text>

        {!above768 && !forced && filterComponent}

        <TableHeader>
          <Checkbox
            disabled={forced}
            ref={checkboxGroupRef}
            onChange={e => {
              if (e.currentTarget.checked) {
                setSeletedNFTs(withDrawableNFTs || [])
              } else {
                setSeletedNFTs([])
              }
            }}
          />
          <Text textAlign="left">{above768 ? 'ID' : 'ID | Token | Status'}</Text>
          <Text textAlign={above768 ? 'left' : 'right'}>
            <Trans>Your liquidity</Trans>
          </Text>

          {above768 && (
            <>
              <Text textAlign="right">Token 1</Text>
              <Text textAlign="right">Token 2</Text>
              <Text textAlign="right">Action</Text>
            </>
          )}
        </TableHeader>

        <div style={{ overflowY: 'auto' }}>
          {(eligiblePositions as UserPositionFarm[])
            .filter(pos => {
              if (forced) {
                return failedNFTs.includes(pos.tokenId.toString())
              }

              return true
            })
            .map(pos => (
              <PositionRow
                selected={selectedNFTs.some(e => e.tokenId.toString() === pos.tokenId.toString())}
                key={pos.tokenId.toString()}
                position={pos}
                farmAddress={selectedFarmAddress}
                forced={forced}
                onChange={(selected: boolean, position: Position | undefined) => {
                  const tokenId = pos.tokenId.toString()
                  if (position) mapPositionInfo.current[tokenId] = position
                  if (selected) setSeletedNFTs(prev => [...prev, pos])
                  else {
                    setSeletedNFTs(prev => prev.filter(item => item.tokenId.toString() !== tokenId))
                  }
                }}
              />
            ))}
        </div>
        <Flex justifyContent="space-between" marginTop="24px">
          <div></div>
          <ButtonPrimary
            fontSize="14px"
            padding="10px 24px"
            width="fit-content"
            onClick={handleWithdraw}
            disabled={forced ? false : !selectedNFTs.length}
            style={forced ? { background: theme.red, color: theme.textReverse } : undefined}
          >
            {forced ? <Trans>Force Withdraw</Trans> : <Trans>Withdraw Selected</Trans>}
          </ButtonPrimary>
        </Flex>
      </ModalContentWrapper>
    </Modal>
  )
}

export default WithdrawModal
