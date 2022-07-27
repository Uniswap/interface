import React, { useState } from 'react'
import { Flex, Box } from 'rebass'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components'
import { t } from '@lingui/macro'

import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useAggregatorStats from 'hooks/useAggregatorStats'
import { DexConfig, dexListConfig } from 'constants/dexes'

import SearchBar from './SearchBar'

type Props = {
  onBack: () => void
}

export const extractUniqueDEXes = (dexIDs: string[]): DexConfig[] => {
  const visibleDEXes = dexIDs.map(id => dexListConfig[id]).filter(Boolean)

  // Names of different IDs can be the same
  const dexConfigByName = visibleDEXes.reduce((acc, dex) => {
    acc[dex.name] = dex
    return acc
  }, {} as Record<string, DexConfig>)

  return Object.values(dexConfigByName)
}

const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SourceList = styled.div`
  width: 100%;
  height: 300px;
  max-height: 300px;
  overflow-y: scroll;
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  row-gap: 24px;

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

const Source = styled.div`
  width: 100%;
  height: 32px;

  display: flex;
  align-items: center;
  column-gap: 16px;
`

const ImageWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;

  img {
    width: 100%;
    height: auto;
  }
`

const SourceName = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
`

const LiquiditySourcesPanel: React.FC<Props> = ({ onBack }) => {
  const { chainId } = useActiveWeb3React()
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase(), 200)

  const { data, error } = useAggregatorStats(chainId)
  if (error || !data) {
    onBack()
    return null
  }

  const dexIDs = Object.keys(data.pools)
  if (dexIDs.length === 0) {
    onBack()
    return null
  }

  const visibleDEXes = extractUniqueDEXes(dexIDs).filter(({ name }) => name.toLowerCase().includes(debouncedSearchText))

  return (
    <Box width="100%">
      <Flex
        width={'100%'}
        flexDirection={'column'}
        sx={{
          rowGap: '20px',
        }}
      >
        <Flex
          alignItems="center"
          sx={{
            // this is to make the arrow stay exactly where it stays in Swap panel
            marginTop: '5px',
          }}
        >
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <BackText>{t`Liquidity Sources`}</BackText>
        </Flex>

        <SearchBar text={searchText} setText={setSearchText} />

        <SourceList>
          {visibleDEXes.map(({ name, icon }) => (
            <Source key={name}>
              <ImageWrapper>
                <img src={icon} alt="" />
              </ImageWrapper>

              <SourceName>{name}</SourceName>
            </Source>
          ))}
        </SourceList>
      </Flex>
    </Box>
  )
}

export default LiquiditySourcesPanel
