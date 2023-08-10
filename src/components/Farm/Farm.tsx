import { useWeb3React } from '@web3-react/core'
import CustomSelector, { SelectorItem } from 'components/CustomSelector/CustomSelector'
import CustomSwitch from 'components/CustomSwitch/CustomSwitch'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { Box } from 'rebass'
import styled from 'styled-components/macro'

import { GammaPair, GammaPairs } from './constants'

const FarmsLayout = styled.div`
  width: 100%;
  border-radius: 10px;
`
const Header = styled.div`
  width: 100%;
  padding-top: 4px;
  justify-content: space-between;
  display: flex;
`

const Switch = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`

export function Farms() {
  const parsedQuery = useParsedQueryString()
  const farmStatus = parsedQuery && parsedQuery.farmStatus ? (parsedQuery.farmStatus as string) : 'active'
  const isMobile = useIsMobile()
  const { chainId } = useWeb3React()
  const navigate = useNavigate()
  const location = useLocation()

  const allGammaFarms = useMemo(() => {
    if (!chainId) return []
    const pairsGroups = (GammaPairs[570] as { [key: string]: GammaPair[] }) || {}
    const allPairs = Object.values(pairsGroups).flat()

    return allPairs.filter((item) => item?.ableToFarm)
  }, [chainId])

  const redirectWithFarmStatus = (status: string) => {
    const currentPath = location.pathname + location.search
    let redirectPath
    if (parsedQuery && parsedQuery.farmStatus) {
      redirectPath = currentPath.replace(`farmStatus=${parsedQuery.farmStatus}`, `farmStatus=${status}`)
    } else {
      redirectPath = `${currentPath}${location.search === '' ? '?' : '&'}farmStatus=${status}`
    }
    navigate(redirectPath)
  }

  const currentTabQueried =
    parsedQuery && parsedQuery.tab
      ? (parsedQuery.tab as string)
      : allGammaFarms.length > 0
      ? 'gamma-farms'
      : 'eternal-farms'

  const v3FarmCategories = useMemo(() => {
    return allGammaFarms.length > 0
      ? [
          {
            text: 'myFarms',
            id: 0,
            link: 'my-farms',
          },
          // {
          //   text: 'pegasysFarms',
          //   id: 1,
          //   link: 'pegasys-farms',
          // },
          {
            text: 'gammaFarms',
            id: 1,
            link: 'gamma-farms',
            hasSeparator: true,
          },
        ]
      : [
          {
            text: 'myFarms',
            id: 0,
            link: 'my-farms',
          },
          {
            text: 'quickswapFarms',
            id: 1,
            link: 'eternal-farms',
          },
        ]
  }, [allGammaFarms])

  const onChangeFarmCategory = useCallback(
    (selected: SelectorItem) => {
      navigate(`?tab=${selected?.link}`)
    },
    [navigate]
  )

  const selectedFarmCategory = useMemo(() => {
    const tab = v3FarmCategories.find((item) => item?.link === currentTabQueried)
    if (!tab) {
      return v3FarmCategories[0]
    } else {
      return tab
    }
  }, [currentTabQueried, v3FarmCategories])

  const farmStatusItems = [
    {
      text: 'active',
      onClick: () => {
        redirectWithFarmStatus('active')
      },
      condition: farmStatus === 'active',
    },
    {
      text: 'ended',
      onClick: () => {
        redirectWithFarmStatus('ended')
      },
      condition: farmStatus === 'ended',
    },
  ]

  return (
    <FarmsLayout>
      <Header>
        <CustomSelector
          height={36}
          items={v3FarmCategories}
          selectedItem={selectedFarmCategory}
          handleChange={onChangeFarmCategory}
        />
        <Switch>
          {selectedFarmCategory.id !== 0 && (
            <div style={{ marginTop: isMobile ? 2 : 0, width: isMobile ? '100%' : 160 }}>
              <CustomSwitch width="100%" height={40} items={farmStatusItems} />
            </div>
          )}
          <div style={{ marginTop: isMobile ? 2 : 0, marginLeft: isMobile ? 0 : 2, width: isMobile ? '100%' : 200 }}>
            {/* <SearchInput placeholder="Search" value={searchValue} setValue={setSearchValue} isIconAfter /> */}
          </div>
        </Switch>
      </Header>

      {selectedFarmCategory.id !== 0 && (
        <>
          <Box mt={2} pl="12px" className="bg-secondary1">
            {/* <CustomTabSwitch
              items={farmFilters}
              selectedItem={farmFilter}
              handleTabChange={setFarmFilter}
              height={50}
            /> */}
          </Box>
          {!isMobile && (
            <Box mt={2} px={3.5}>
              <Box width="90%">
                {/* <SortColumns sortColumns={sortByDesktopItems} selectedSort={sortBy} sortDesc={sortDesc} /> */}
              </Box>
            </Box>
          )}
        </>
      )}

      {
        selectedFarmCategory?.id === 0 && <></>
        // <FarmingMyFarms search={searchValue} chainId={chainIdToUse} />
      }
      {/* {selectedFarmCategory?.id === 1 && (
        <EternalFarmsPage
          farmFilter={farmFilter.id}
          search={searchValue}
          sortBy={sortBy}
          sortDesc={sortDesc}
          chainId={chainIdToUse}
        />
      )}
      {selectedFarmCategory?.id === 2 && (
        <GammaFarmsPage farmFilter={farmFilter.id} search={searchValue} sortBy={sortBy} sortDesc={sortDesc} />
      )} */}
    </FarmsLayout>
  )
}
