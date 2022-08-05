import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Info, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverDropdown from 'components/HoverDropdown'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useToken, useTokens } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { usePool } from 'hooks/usePools'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useTokensPrice } from 'state/application/hooks'
import { useFarmAction, usePostionFilter, useProMMFarms } from 'state/farms/promm/hooks'
import { StyledInternalLink } from 'theme'
import { PositionDetails } from 'types/position'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'

import {
  Checkbox,
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
}: {
  selected: boolean
  position: PositionDetails
  onChange: (value: boolean) => void
}) => {
  const { token0: token0Address, token1: token1Address, fee: feeAmount, liquidity, tickLower, tickUpper } = position

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const usdPrices = useTokensPrice([token0, token1], VERSION.ELASTIC)

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
    (positionSDK.pool.tickCurrent < position.tickLower || positionSDK.pool.tickCurrent > position.tickUpper)

  const usd =
    (usdPrices?.[0] || 0) * parseFloat(positionSDK?.amount0.toExact() || '0') +
    (usdPrices?.[1] || 0) * parseFloat(positionSDK?.amount1.toExact() || '0')

  const above768 = useMedia('(min-width: 768px)')

  return (
    <TableRow>
      <Checkbox
        type="checkbox"
        onChange={e => {
          onChange(e.currentTarget.checked)
        }}
        checked={selected}
      />

      {above768 ? (
        <>
          <Flex alignItems="center">
            {/* <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} />*/}
            <Text>{position.tokenId.toString()}</Text>
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
            <RangeBadge removed={removed} inRange={!outOfRange} />
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
              placement="right"
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

function ProMMDepositNFTModal({
  selectedFarmAddress,
  onDismiss,
}: {
  onDismiss: () => void
  selectedFarmAddress: string
}) {
  const qs = useParsedQueryString()
  const tab = qs.tab || 'active'

  const { account } = useActiveWeb3React()
  const theme = useTheme()
  const checkboxGroupRef = useRef<any>()
  const above768 = useMedia('(min-width: 768px)')
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[selectedFarmAddress || '']
  const poolAddresses = selectedFarm
    ?.filter(farm => (tab === 'active' ? farm.endTime > +new Date() / 1000 : farm.endTime < +new Date() / 1000))
    .map(farm => farm.poolAddress.toLowerCase())
  const [selectedNFTs, setSeletedNFTs] = useState<string[]>([])
  const tokens = useTokens(selectedFarm.map(farm => [farm.token0, farm.token1]).reduce((arr, cur) => [...arr, ...cur]))

  const { deposit } = useFarmAction(selectedFarmAddress)

  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const { filterOptions, activeFilter, setActiveFilter, eligiblePositions } = usePostionFilter(
    positions || [],
    poolAddresses,
  )

  const [showMenu, setShowMenu] = useState(false)
  const ref = useRef(null)
  useOnClickOutside(ref, () => setShowMenu(false))
  useEffect(() => {
    if (!checkboxGroupRef.current) return
    if (selectedNFTs.length === 0) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = false
    } else if (
      selectedNFTs.length > 0 &&
      eligiblePositions?.length &&
      selectedNFTs.length < eligiblePositions?.length
    ) {
      checkboxGroupRef.current.checked = false
      checkboxGroupRef.current.indeterminate = true
    } else {
      checkboxGroupRef.current.checked = true
      checkboxGroupRef.current.indeterminate = false
    }
  }, [selectedNFTs.length, eligiblePositions])

  const { mixpanelHandler } = useMixpanel()
  if (!selectedFarmAddress) return null

  const handleDeposit = async () => {
    const txHash = await deposit(selectedNFTs.map(item => BigNumber.from(item)))
    if (txHash) {
      const finishedPoses = eligiblePositions.filter(pos => selectedNFTs.includes(pos.tokenId.toString()))
      finishedPoses.forEach(pos => {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_DEPOSIT_LIQUIDITY_COMPLETED, {
          token_1: tokens[pos.token0],
          token_2: tokens[pos.token1],
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
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} maxHeight={80} width="80vw" maxWidth="808px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>
            <Trans>Deposit your liquidity</Trans>
          </Title>

          <Flex sx={{ gap: '12px' }}>
            {above768 && filterComponent}
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <Text fontSize="12px" marginTop="20px" color={theme.subText}>
          <Trans>
            Deposit your liquidity first to enable farming. Only your in range liquidity positions will earn you farming
            rewards
          </Trans>
        </Text>

        {!above768 && filterComponent}

        {positionsLoading ? (
          <LocalLoader />
        ) : !eligiblePositions?.length ? (
          <Flex
            alignItems="center"
            justifyContent="center"
            padding="16px"
            color={theme.subText}
            marginTop="40px"
            flexDirection="column"
          >
            <Info size="48px" />
            <Text fontSize={14} textAlign="center" marginTop="16px" maxWidth="480px" lineHeight={1.5}>
              <Trans>
                You dont have any relevant liquidity positions yet.
                <br /> Add liquidity to the farming pools first. Check out our{' '}
                <StyledInternalLink to="/pools">Pools.</StyledInternalLink>
              </Trans>
            </Text>
          </Flex>
        ) : (
          <>
            <TableHeader>
              <Checkbox
                type="checkbox"
                ref={checkboxGroupRef}
                onChange={e => {
                  if (e.currentTarget.checked) {
                    setSeletedNFTs(eligiblePositions?.map(pos => pos.tokenId.toString()) || [])
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
                  <Text textAlign="right">Status</Text>
                </>
              )}
            </TableHeader>

            <div style={{ overflowY: 'scroll', minHeight: '100px' }}>
              {eligiblePositions.map(pos => (
                <PositionRow
                  selected={selectedNFTs.includes(pos.tokenId.toString())}
                  key={pos.tokenId.toString()}
                  position={pos}
                  onChange={(selected: boolean) => {
                    if (selected) setSeletedNFTs(prev => [...prev, pos.tokenId.toString()])
                    else {
                      setSeletedNFTs(prev => prev.filter(item => item !== pos.tokenId.toString()))
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
                onClick={handleDeposit}
                disabled={!selectedNFTs.length}
              >
                <Trans>Deposit Selected</Trans>
              </ButtonPrimary>
            </Flex>
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  )
}

export default ProMMDepositNFTModal
