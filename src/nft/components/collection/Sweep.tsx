import { BigNumber } from '@ethersproject/bignumber'
import { useBag, useCollectionFilters } from 'nft/hooks'
import { fetchSweep } from 'nft/queries'
import { GenieCollection, Markets } from 'nft/types'
import { calcPoolPrice } from 'nft/utils'
import { default as Slider } from 'rc-slider'
import { useMemo, useReducer, useState } from 'react'
import { useQuery } from 'react-query'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const SweepContainer = styled.div`
  display: flex;
  gap: 60px;
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.backgroundModule};
  justify-content: space-between;
`

const StyledSlider = styled(Slider)`
  cursor: pointer;
`

const SweepLeftmostContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 24px;
`

const SweepRightmostContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
`

const SweepSubContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
`

const InputContainer = styled.input`
  width: 96px;
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background: none;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 14px;
  font-weight: 400px;
  line-height: 20px;

  :hover,
  :focus {
    outline: none;
    border: 1px solid ${({ theme }) => theme.accentAction};
  }
`

const ToggleContainer = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background: none;
  border-radius: 12px;
  padding: 4px;
  cursor: pointer;
`

const ToggleSwitch = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textSecondary)};
  padding: 4px 8px;
  border-radius: 8px;
  background-color: ${({ theme, active }) => (active ? theme.backgroundInteractive : `none`)};
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
`

const NftDisplayContainer = styled.div`
  position: relative;
  width: 34px;
  height: 34px;
`

const NftHolder = styled.div<{ index: number; src: string | undefined }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: ${({ theme, src }) => (src ? `url(${src})` : theme.textTertiary)};
  background-size: 26px;
  opacity: ${({ src, index }) => (src ? 1.0 : index === 0 ? 0.9 : index === 1 ? 0.6 : 0.3)};
  transform: ${({ index }) =>
    index === 0
      ? 'translate(-50%, -50%) rotate(-4.42deg)'
      : index === 1
      ? 'translate(-50%, -50%) rotate(-14.01deg)'
      : 'translate(-50%, -50%) rotate(10.24deg)'};
  z-index: ${({ index }) => 3 - index};
`

export const NftDisplay = () => {
  const itemsInBag = useBag((s) => s.itemsInBag)
  return (
    <NftDisplayContainer>
      {[...Array(3)].map((_, index) => {
        return (
          <NftHolder
            key={index}
            index={index}
            src={itemsInBag.length - 1 >= index ? itemsInBag[index].asset.smallImageUrl : undefined}
          />
        )
      })}
    </NftDisplayContainer>
  )
}

interface SweepProps {
  contractAddress: string
  collectionStats: GenieCollection
}

export const Sweep = ({ contractAddress, collectionStats }: SweepProps) => {
  const theme = useTheme()

  const [isItemsToggled, toggleSweep] = useReducer((s) => !s, true)
  const [sweepAmount, setSweepAmount] = useState<number | undefined>()

  const addAssetsToBag = useBag((s) => s.addAssetsToBag)
  const removeAssetsFromBag = useBag((s) => s.removeAssetsFromBag)
  const itemsInBag = useBag((s) => s.itemsInBag)

  const traits = useCollectionFilters((state) => state.traits)
  const markets = useCollectionFilters((state) => state.markets)

  const getSweepFetcherParams = (market: Markets.NFTX | Markets.NFT20 | 'others') => {
    const isMarketFiltered = !!markets.length
    const allOtherMarkets = [Markets.Opensea, Markets.NFT20, Markets.LooksRare]

    if (isMarketFiltered) {
      if (market === 'others') {
        return { contractAddress, traits, markets }
      }
      if (!markets.includes(market)) return { contractAddress: '', traits: [], markets: [] }
    }

    switch (market) {
      case Markets.NFTX:
      case Markets.NFT20:
        return { contractAddress, traits, markets: [market] }
      case 'others':
        return { contractAddress, traits, markets: allOtherMarkets }
    }
  }

  const { data: collectionAssets, isFetched: isCollectionAssetsFetched } = useQuery(
    ['sweepAssets', getSweepFetcherParams('others')],
    () => fetchSweep(getSweepFetcherParams('others')),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const { data: nftxCollectionAssets, isFetched: isNftxCollectionAssetsFetched } = useQuery(
    ['nftxSweepAssets', collectionStats, getSweepFetcherParams(Markets.NFTX)],
    () =>
      collectionStats.marketplaceCount?.some(
        (marketStat) => marketStat.marketplace === Markets.NFTX && marketStat.count > 0
      )
        ? fetchSweep(getSweepFetcherParams(Markets.NFTX))
        : [],

    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const { data: nft20CollectionAssets, isFetched: isNft20CollectionAssetsFetched } = useQuery(
    ['nft20SweepAssets', getSweepFetcherParams(Markets.NFT20)],
    () =>
      collectionStats.marketplaceCount?.some(
        (marketStat) => marketStat.marketplace === Markets.NFT20 && marketStat.count > 0
      )
        ? fetchSweep(getSweepFetcherParams(Markets.NFT20))
        : [],

    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const allAssetsFetched = isCollectionAssetsFetched && isNftxCollectionAssetsFetched && isNft20CollectionAssetsFetched

  const sortedAssets = useMemo(() => {
    if (!allAssetsFetched || !collectionAssets || !nftxCollectionAssets || !nft20CollectionAssets) return undefined

    let counterNFTX = 0
    let counterNFT20 = 0

    let jointCollections = [...nftxCollectionAssets, ...nft20CollectionAssets]

    jointCollections.forEach((asset) => {
      if (!asset.openseaSusFlag) {
        const isNFTX = asset.marketplace === Markets.NFTX
        asset.currentEthPrice = calcPoolPrice(asset, isNFTX ? counterNFTX : counterNFT20)
        BigNumber.from(asset.currentEthPrice).gte(0) && (isNFTX ? counterNFTX++ : counterNFT20++)
      }
    })

    jointCollections = collectionAssets.concat(jointCollections)

    jointCollections.sort((a, b) => {
      return BigNumber.from(a.currentEthPrice).gt(BigNumber.from(b.currentEthPrice)) ? 1 : -1
    })

    let validAssets = jointCollections.filter(
      (asset) => BigNumber.from(asset.currentEthPrice).gte(0) && !asset.openseaSusFlag
    )

    validAssets = validAssets.slice(
      0,
      Math.max(collectionAssets.length, nftxCollectionAssets.length, nft20CollectionAssets.length)
    )

    return validAssets
  }, [collectionAssets, nftxCollectionAssets, nft20CollectionAssets, allAssetsFetched])

  const sweepItemsInBag = useMemo(() => {
    return itemsInBag.filter((item) => item.inSweep).map((item) => item.asset)
  }, [itemsInBag])

  const handleSliderChange = (value: number | number[]) => {
    if (typeof value === 'number') {
      setSweepAmount(value || undefined)

      if (sortedAssets) {
        console.log('stats')
        console.log(sweepItemsInBag)
        console.log(value)
        console.log()
        if (sweepItemsInBag.length < value) {
          addAssetsToBag(sortedAssets.slice(sweepItemsInBag.length, value), true)
        } else {
          removeAssetsFromBag(sweepItemsInBag.slice(value, sweepItemsInBag.length))
        }
      }
    }
  }

  return (
    <SweepContainer>
      <SweepLeftmostContainer>
        <ThemedText.SubHeaderSmall color="textPrimary" lineHeight="20px" paddingTop="6px" paddingBottom="6px">
          Sweep
        </ThemedText.SubHeaderSmall>
        <SweepSubContainer>
          <StyledSlider
            defaultValue={0}
            trackStyle={{
              top: '3px',
              height: '8px',
              background: `radial-gradient(101.8% 4091.31% at 0% 0%, #4673FA 0%, #9646FA 100%)`,
            }}
            handleStyle={{
              top: '3px',
              width: '12px',
              height: '20px',
              backgroundColor: `${theme.textPrimary}`,
              borderRadius: '4px',
              border: 'none',
              boxShadow: `${theme.shallowShadow.slice(0, -1)}`,
            }}
            railStyle={{
              top: '3px',
              height: '8px',
              backgroundColor: `${theme.accentActionSoft}`,
            }}
            onChange={handleSliderChange}
          />
          <InputContainer placeholder="0" value={sweepAmount ?? ''} />
          <ToggleContainer onClick={toggleSweep}>
            <ToggleSwitch active={isItemsToggled}>Items</ToggleSwitch>
            <ToggleSwitch active={!isItemsToggled}>ETH</ToggleSwitch>
          </ToggleContainer>
        </SweepSubContainer>
      </SweepLeftmostContainer>
      <SweepRightmostContainer>
        <div>100 ETH</div>
        <NftDisplay />
      </SweepRightmostContainer>
    </SweepContainer>
  )
}
