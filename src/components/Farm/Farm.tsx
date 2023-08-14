import { useWeb3React } from '@web3-react/core'
import CustomSelector, { SelectorItem } from 'components/CustomSelector/CustomSelector'
import CustomSwitch from 'components/CustomSwitch/CustomSwitch'
import CustomTabSwitch from 'components/CustomTabSwitch/CustomTabSwitch'
import SearchInput from 'components/SearchInput/SearchInput'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import { GammaPair, GammaPairs, GlobalConst } from './constants'
import SortColumns from './SortColumn'

const FarmsLayout = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 0 10px 0 10px;
  background: ${({ theme }) => theme.backgroundScrolledSurface};
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

const TabSwitchLayout = styled.div`
  width: 100%;
  justify-content: space-between;
  display: flex;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 16px;
`

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
  const [searchValue, setSearchValue] = useState('')

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
          {
            text: 'pegasysFarms',
            id: 1,
            link: 'pegasys-farms',
          },
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
            text: 'pegasysFarms',
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

  const farmFilters = useMemo(
    () => [
      {
        text: 'allFarms',
        id: GlobalConst.utils.v3FarmFilter.allFarms,
      },
      {
        text: 'stablecoins',
        id: GlobalConst.utils.v3FarmFilter.stableCoin,
      },
      {
        text: 'blueChips',
        id: GlobalConst.utils.v3FarmFilter.blueChip,
      },
      {
        text: 'stableLPs',
        id: GlobalConst.utils.v3FarmFilter.stableLP,
      },
      {
        text: 'otherLPs',
        id: GlobalConst.utils.v3FarmFilter.otherLP,
      },
    ],
    []
  )

  const sortColumns = [
    {
      text: 'pool',
      index: GlobalConst.utils.v3FarmSortBy.pool,
      width: 0.3,
      justify: 'flex-start',
    },
    {
      text: 'tvl',
      index: GlobalConst.utils.v3FarmSortBy.tvl,
      width: 0.2,
      justify: 'flex-start',
    },
    {
      text: 'rewards',
      index: GlobalConst.utils.v3FarmSortBy.rewards,
      width: 0.3,
      justify: 'flex-start',
    },
    {
      text: 'apr',
      index: GlobalConst.utils.v3FarmSortBy.apr,
      width: 0.2,
      justify: 'flex-start',
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

  const [farmFilter, setFarmFilter] = useState(farmFilters[0])
  const [sortBy, setSortBy] = useState(GlobalConst.utils.v3FarmSortBy.pool)
  const [sortDesc, setSortDesc] = useState(false)

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
              <ThemeToggleContainer>
                <CustomSwitch items={farmStatusItems} />
              </ThemeToggleContainer>
            </div>
          )}
          <div style={{ marginTop: isMobile ? 2 : 0, marginLeft: isMobile ? 0 : 10, width: isMobile ? '100%' : 200 }}>
            <ThemeToggleContainer>
              <SearchInput placeholder="Search" value={searchValue} setValue={setSearchValue} isIconAfter />
            </ThemeToggleContainer>
          </div>
        </Switch>
      </Header>

      {selectedFarmCategory.id !== 0 && (
        <>
          <TabSwitchLayout>
            <CustomTabSwitch
              items={farmFilters}
              selectedItem={farmFilter}
              handleTabChange={setFarmFilter}
              height={50}
            />
          </TabSwitchLayout>
          {!isMobile && (
            <TabFiltersLayout>
              <SortColumns sortColumns={sortByDesktopItems} selectedSort={sortBy} sortDesc={sortDesc} />
            </TabFiltersLayout>
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
