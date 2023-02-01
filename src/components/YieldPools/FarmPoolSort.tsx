import { Trans } from '@lingui/macro'
import { useRef, useState } from 'react'
import { X } from 'react-feather'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownIcon } from 'assets/svg/down.svg'
import { ButtonEmpty } from 'components/Button'
import { Swap as SwapIcon } from 'components/Icons'
import Modal from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import { VERSION } from 'constants/v2'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  padding: 0 12px;
  background: ${({ theme }) => theme.background};
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  border-radius: 999px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 140px;
  height: 36px;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: fit-content;
    padding: 10px;
  `};
`

const DropDownMenu = styled.div`
  position: absolute;
  top: 52px;
  overflow: hidden;
  left: 0;
  right: 0;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 16px;
  padding: 8px 0;
  z-index: ${Z_INDEXS.POPOVER_CONTAINER};
`

const Row = styled.div`
  padding: 8px 12px;
  color: ${({ theme }) => theme.subText};
  :hover {
    background: ${({ theme }) => theme.buttonBlack};
  }
`
const poolSortOptions = (tab: string) => [
  {
    orderBy: 'apr',
    orderDirection: 'asc',
    label: <Trans>AVG APR ↑</Trans>,
  },
  {
    orderBy: 'apr',
    orderDirection: 'desc',
    label: <Trans>AVG APR ↓</Trans>,
  },
  {
    orderBy: 'tvl',
    orderDirection: 'asc',
    label: tab === VERSION.CLASSIC ? <Trans>AMP LIQUIDITY ↑</Trans> : <Trans>TVL ↑</Trans>,
  },
  {
    orderBy: 'tvl',
    orderDirection: 'desc',
    label: tab === VERSION.CLASSIC ? <Trans>AMP LIQUIDITY ↓</Trans> : <Trans>TVL ↓</Trans>,
  },
  {
    orderBy: 'volume',
    orderDirection: 'asc',
    label: <Trans>VOLUME ↑</Trans>,
  },
  {
    orderBy: 'volume',
    orderDirection: 'desc',
    label: <Trans>VOLUME ↓</Trans>,
  },
  {
    orderBy: 'fee',
    orderDirection: 'asc',
    label: <Trans>FEES ↑</Trans>,
  },
  {
    orderBy: 'fee',
    orderDirection: 'desc',
    label: <Trans>FEES ↓</Trans>,
  },
  {
    orderBy: 'my_liquidity',
    orderDirection: 'asc',
    label: <Trans>MY LIQUIDITY ↑</Trans>,
  },
  {
    orderBy: 'my_liquidity',
    orderDirection: 'desc',
    label: <Trans>MY LIQUIDITY ↓</Trans>,
  },
]

const farmSortOptions = [
  {
    orderBy: 'apr',
    orderDirection: 'asc',
    label: <Trans>AVG APR ↑</Trans>,
  },
  {
    orderBy: 'apr',
    orderDirection: 'desc',
    label: <Trans>AVG APR ↓</Trans>,
  },
  {
    orderBy: 'staked_tvl',
    orderDirection: 'asc',
    label: <Trans>STAKED TVL ↑</Trans>,
  },
  {
    orderBy: 'staked_tvl',
    orderDirection: 'desc',
    label: <Trans>STAKED TVL ↓</Trans>,
  },
  {
    orderBy: 'end_time',
    orderDirection: 'asc',
    label: <Trans>END TIME ↑</Trans>,
  },
  {
    orderBy: 'end_time',
    orderDirection: 'desc',
    label: <Trans>END TIME ↓</Trans>,
  },
  {
    orderBy: 'my_deposit',
    orderDirection: 'asc',
    label: <Trans>MY DEPOSIT ↑</Trans>,
  },
  {
    orderBy: 'my_deposit',
    orderDirection: 'desc',
    label: <Trans>MY DEPOSIT ↓</Trans>,
  },
  {
    orderBy: 'my_reward',
    orderDirection: 'asc',
    label: <Trans>MY REWARD ↑</Trans>,
  },
  {
    orderBy: 'my_reward',
    orderDirection: 'desc',
    label: <Trans>MY REWARD ↓</Trans>,
  },
]

const FarmSort = ({ className }: { className?: string }) => {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const orderDirection = searchParams.get('orderDirection') || 'desc'
  const orderBy = searchParams.get('orderBy') || (pathname.startsWith('/farms') ? 'my_deposit' : 'tvl')
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setShow(false)
  })

  const tab = searchParams.get('tab') || VERSION.ELASTIC

  const sortOptions = pathname.startsWith('/farms') ? farmSortOptions : poolSortOptions(tab)

  const theme = useTheme()
  const selectedOption = sortOptions.find(item => item.orderBy === orderBy && item.orderDirection === orderDirection)

  const [show, setShow] = useState(false)
  const upToExtraSmall = useMedia('(max-width: 576px)')

  return (
    <>
      <Wrapper
        className={className}
        role="button"
        ref={ref}
        onClick={e => {
          e.stopPropagation()
          setShow(prev => !prev)
        }}
      >
        <Flex alignItems="center">
          <SwapIcon size={20} />
          {!upToExtraSmall && <Text marginLeft="4px">{selectedOption?.label}</Text>}
        </Flex>
        {!upToExtraSmall && <DropdownIcon style={{ transform: `rotate(${show ? '180deg' : '0'})` }} />}

        {show && !upToExtraSmall && (
          <DropDownMenu>
            {sortOptions.map(item => (
              <Row
                key={item.orderBy + '_' + item.orderDirection}
                role="button"
                onClick={() => {
                  searchParams.set('orderBy', item.orderBy)
                  searchParams.set('orderDirection', item.orderDirection)
                  setSearchParams(searchParams)
                }}
              >
                {item.label}
              </Row>
            ))}
          </DropDownMenu>
        )}
      </Wrapper>

      <Modal
        isOpen={show && upToExtraSmall}
        onDismiss={() => setShow(false)}
        maxWidth="808px"
        maxHeight={80}
        minHeight={50}
      >
        <Flex flexDirection="column" width="100%" padding="24px 20px" backgroundColor={theme.background}>
          <Flex alignItems="center" justifyContent="space-between">
            <Text fontWeight="500">
              <Trans>Sort</Trans>
            </Text>

            <ButtonEmpty onClick={() => setShow(false)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          {sortOptions.map(item => (
            <Text
              key={item.orderBy + '_' + item.orderDirection}
              fontWeight="500"
              fontSize="12px"
              padding="12px 0"
              color={theme.subText}
              role="button"
              onClick={() => {
                searchParams.set('orderBy', item.orderBy)
                searchParams.set('orderDirection', item.orderDirection)
                setSearchParams(searchParams)
              }}
            >
              {item.label}
            </Text>
          ))}
        </Flex>
      </Modal>
    </>
  )
}

export default FarmSort
