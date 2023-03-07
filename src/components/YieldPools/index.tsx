import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import LocalLoader from 'components/LocalLoader'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import { FARM_TAB } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { useFarmsData } from 'state/farms/classic/hooks'
import { Farm } from 'state/farms/classic/types'

import ConfirmHarvestingModal from './ConfirmHarvestingModal'

const YieldPools = ({ loading, active }: { loading: boolean; active?: boolean }) => {
  const theme = useTheme()
  const blockNumber = useBlockNumber()
  const { search = '', ...qs } = useParsedQueryString<{ search: string }>()
  const { chainId } = useActiveWeb3React()
  const { data: farmsByFairLaunch } = useFarmsData()

  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const [isCheckUserStaked, setIsCheckUserStaked] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>()
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)

  const activeTab = active ? 'active' : 'ended'
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const debouncedSearchText = useDebounce(search.trim().toLowerCase(), 200)

  const filterFarm = useCallback(
    (farm: Farm) => {
      // TODO: hard code for SIPHER. Need to be remove later
      const isSipherFarm =
        farm.fairLaunchAddress.toLowerCase() === '0xc0601973451d9369252Aee01397c0270CD2Ecd60'.toLowerCase() &&
        chainId === ChainId.MAINNET

      if (farm.rewardPerSeconds) {
        // for active/ended farms
        return (
          currentTimestamp &&
          (qs.type === FARM_TAB.MY_FARMS
            ? true
            : active
            ? farm.endTime >= currentTimestamp
            : farm.endTime < currentTimestamp) &&
          // search farms
          (debouncedSearchText
            ? farm.token0?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.token1?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.id === debouncedSearchText
            : true) &&
          // stakedOnly
          (stakedOnly[activeTab] || qs.type === FARM_TAB.MY_FARMS
            ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
            : true)
        )
      } else {
        // for active/ended farms
        return (
          blockNumber &&
          (qs.type === FARM_TAB.MY_FARMS
            ? true
            : isSipherFarm
            ? active
            : active
            ? farm.endBlock >= blockNumber
            : farm.endBlock < blockNumber) &&
          // search farms
          (debouncedSearchText
            ? farm.token0?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.token1?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.id === debouncedSearchText
            : true) &&
          // stakedOnly
          (stakedOnly[activeTab] || qs.type === FARM_TAB.MY_FARMS
            ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
            : true)
        )
      }
    },
    [active, activeTab, blockNumber, debouncedSearchText, stakedOnly, currentTimestamp, chainId, qs.type],
  )

  const farms = useMemo(
    () =>
      Object.keys(farmsByFairLaunch).reduce((acc: { [key: string]: Farm[] }, address) => {
        const currentFarms = farmsByFairLaunch[address].filter(farm => filterFarm(farm))
        if (currentFarms.length) acc[address] = currentFarms
        return acc
      }, {}),
    [farmsByFairLaunch, filterFarm],
  )

  const noFarms = !Object.keys(farms).length

  useEffect(() => {
    // auto enable stakedOnly if user have rewards on ended farms
    if (!active && !stakedOnly['ended'] && !isCheckUserStaked) {
      const staked = Object.keys(farmsByFairLaunch).filter(address => {
        return !!farmsByFairLaunch[address].filter(farm => {
          if (farm.rewardPerSeconds) {
            return (
              currentTimestamp &&
              farm.endTime < currentTimestamp &&
              farm.userData?.stakedBalance &&
              BigNumber.from(farm.userData.stakedBalance).gt(0)
            )
          } else {
            return (
              blockNumber &&
              farm.endBlock < blockNumber &&
              farm.userData?.stakedBalance &&
              BigNumber.from(farm.userData.stakedBalance).gt(0)
            )
          }
        }).length
      })

      if (staked.length) {
        setIsCheckUserStaked(true)
        setStakedOnly(prev => ({ ...prev, ended: true }))
      }
    }
  }, [active, stakedOnly, farmsByFairLaunch, blockNumber, isCheckUserStaked, currentTimestamp])

  return (
    <>
      <ConfirmHarvestingModal />

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
        >
          <Text color={theme.subText}>
            {stakedOnly[activeTab] || debouncedSearchText ? (
              <Trans>No Farms found</Trans>
            ) : (
              <Trans>Currently there are no Farms.</Trans>
            )}
          </Text>
        </Flex>
      ) : (
        Object.keys(farms).map(fairLaunchAddress => {
          return (
            <FairLaunchPools
              key={fairLaunchAddress}
              fairLaunchAddress={fairLaunchAddress}
              farms={farms[fairLaunchAddress]}
              active={active}
            />
          )
        })
      )}
    </>
  )
}

export default YieldPools
