import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import CustomSelector, { SelectorItem } from 'components/CustomSelector/CustomSelector'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtomValue } from 'jotai'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import { GammaPairs, GlobalConst } from './constants'
import GammaFarmsPage from './GammaFarms/GammaFarmsPage'
import FarmingMyFarms from './MyFarms/FarmMyFarms'
import SearchBar from './SearchBar'
import { buildRedirectPath, farmFilters, filterFarmStringAtom, sortColumns, tabsFarm, tabsFarmDefault } from './utils'

const FarmsLayout = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 0 12px 0;
  gap: 10px;
  background: ${({ theme }) => theme.backgroundScrolledSurface};
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
`
const Header = styled.div`
  width: 100%;
  padding-top: 10px;
  justify-content: space-between;
  display: flex;
`

const Switch = styled.div`
  display: flex;
  align-items: center;
`

// const TabSwitchLayout = styled.div`
//   width: 100%;
//   justify-content: space-between;
//   display: flex;
//   background: ${({ theme }) => theme.backgroundModule};
//   border-radius: 16px;
// `

const TabFiltersLayout = styled.div`
  width: 100%;
  justify-content: space-between;
  display: flex;
`
const ThemeToggleContainer = styled.div`
  margin: 0 0 6px;
`

export function Farms() {
  const parsedQuery = useParsedQueryString()
  const farmStatus = parsedQuery && parsedQuery.farmStatus ? (parsedQuery.farmStatus as string) : 'active'
  const isMobile = useIsMobile()
  const { chainId } = useWeb3React()
  const navigate = useNavigate()
  const location = useLocation()
  const filterSearch = useAtomValue(filterFarmStringAtom)

  const [farmFilter, setFarmFilter] = useState(farmFilters[0])
  const [sortBy, setSortBy] = useState(GlobalConst.utils.v3FarmSortBy.pool)
  const [sortDesc, setSortDesc] = useState(false)

  const allGammaFarms = useMemo(() => {
    const pairsGroups = GammaPairs[ChainId.ROLLUX]
    if (!pairsGroups) {
      return []
    }
    const allPairs = Object.values(pairsGroups).flat()
    return allPairs.filter((item) => item?.ableToFarm)
  }, [])

  const redirectWithFarmStatus = (status: string) => {
    const currentPath = location.pathname + location.search
    const redirectPath = buildRedirectPath(currentPath, parsedQuery, status)
    navigate(redirectPath)
  }

  const currentTabQueried = parsedQuery && parsedQuery.tab ? (parsedQuery.tab as string) : 'gamma-farms'

  const v3FarmCategories = useMemo(() => {
    return allGammaFarms.length > 0 ? tabsFarm : tabsFarmDefault
  }, [allGammaFarms])

  const onChangeFarmCategory = useCallback(
    (selected: SelectorItem) => {
      navigate(`?tab=${selected?.link}`)
    },
    [navigate]
  )

  const selectedFarmCategory = useMemo(() => {
    const tab = v3FarmCategories.find((item) => item?.link === currentTabQueried)
    return tab || v3FarmCategories[0]
  }, [currentTabQueried, v3FarmCategories])

  const farmStatusItems = [
    {
      text: 0,
      onClick: () => {
        redirectWithFarmStatus('active')
      },
      condition: farmStatus === 'active',
    },
    {
      text: 1,
      onClick: () => {
        redirectWithFarmStatus('ended')
      },
      condition: farmStatus === 'ended',
    },
  ]

  const sortByDesktopItems = sortColumns.map((item) => {
    return {
      ...item,
      onClick: () => {
        if (sortBy === item.index) {
          setSortDesc(!sortDesc)
        } else {
          setSortBy(item.index)
          setSortDesc(false)
        }
      },
    }
  })

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
          {/* {selectedFarmCategory.id !== 0 && (
            <div style={{ marginTop: isMobile ? 2 : 0, width: isMobile ? '100%' : 160 }}>
              <ThemeToggleContainer>
                <CustomSwitch items={farmStatusItems} />
              </ThemeToggleContainer>
            </div>
          )} */}
          <div style={{ marginTop: isMobile ? 2 : 0, marginLeft: isMobile ? 0 : 10, width: isMobile ? '100%' : 200 }}>
            <ThemeToggleContainer>
              <SearchBar />
            </ThemeToggleContainer>
          </div>
        </Switch>
      </Header>
      {selectedFarmCategory.id !== 0 && (
        <>
          {/* TODO: return this component after receive new pool with differents types */}
          {/* <TabSwitchLayout>
            <CustomTabSwitch
              items={farmFilters}
              selectedItem={farmFilter}
              handleTabChange={setFarmFilter}
              height={50}
            />
          </TabSwitchLayout> */}
          {/* {!isMobile && (
            <TabFiltersLayout>
              <SortColumns sortColumns={sortByDesktopItems} selectedSort={sortBy} sortDesc={sortDesc} />
            </TabFiltersLayout>
          )} */}
        </>
      )}

      {selectedFarmCategory?.id === 0 && chainId && <FarmingMyFarms search={filterSearch} chainId={chainId} />}

      {selectedFarmCategory?.id === 1 && (
        <GammaFarmsPage farmFilter={farmFilter.id} search={filterSearch} sortBy={sortBy} sortDesc={sortDesc} />
      )}
    </FarmsLayout>
  )
}
