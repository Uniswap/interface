import 'rc-slider/assets/index.css'

import { BigNumber } from '@ethersproject/bignumber'
import { formatEther, parseEther } from '@ethersproject/units'
import { useBag, useCollectionFilters } from 'nft/hooks'
import { fetchSweep } from 'nft/queries'
import { GenieAsset, GenieCollection, Markets } from 'nft/types'
import { calcPoolPrice, formatWeiToDecimal } from 'nft/utils'
import { default as Slider } from 'rc-slider'
import { useEffect, useMemo, useReducer, useState } from 'react'
import { useQuery } from 'react-query'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const SweepContainer = styled.div<{ showSweep: boolean }>`
  display: ${({ showSweep }) => (showSweep ? 'flex' : 'none')};
  gap: 60px;
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.backgroundModule};
  justify-content: space-between;
`

const StyledSlider = styled(Slider)`
  cursor: pointer;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
`

const SweepLeftmostContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 24px;
`

const SweepRightmostContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
`

const SweepHeaderContainer = styled.div`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
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

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    width: 100%;
  }

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

const wholeNumberRegex = RegExp(`^(0|[1-9][0-9]*)$`)
const twoDecimalPlacesRegex = RegExp(`^\\d*\\.?\\d{0,2}$`)

interface NftDisplayProps {
  nfts: GenieAsset[]
}

export const NftDisplay = ({ nfts }: NftDisplayProps) => {
  return (
    <NftDisplayContainer>
      {[...Array(3)].map((_, index) => {
        return (
          <NftHolder
            key={index}
            index={index}
            src={nfts.length - 1 >= index ? nfts[nfts.length - 1 - index].smallImageUrl : undefined}
          />
        )
      })}
    </NftDisplayContainer>
  )
}

interface SweepProps {
  contractAddress: string
  collectionStats: GenieCollection
  minPrice: string
  maxPrice: string
  showSweep: boolean
}

export const Sweep = ({ contractAddress, collectionStats, minPrice, maxPrice, showSweep }: SweepProps) => {
  const theme = useTheme()

  const [isItemsToggled, toggleSweep] = useReducer((state) => !state, true)
  const [sweepAmount, setSweepAmount] = useState<string>('')

  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const lockSweepItems = useBag((state) => state.lockSweepItems)

  const traits = useCollectionFilters((state) => state.traits)
  const markets = useCollectionFilters((state) => state.markets)

  const getSweepFetcherParams = (market: Markets.NFTX | Markets.NFT20 | 'others') => {
    const isMarketFiltered = !!markets.length
    const allOtherMarkets = [Markets.Opensea, Markets.X2Y2, Markets.LooksRare]

    if (isMarketFiltered) {
      if (market === 'others') {
        return { contractAddress, traits, markets }
      }
      if (!markets.includes(market)) return { contractAddress: '', traits: [], markets: [] }
    }

    switch (market) {
      case Markets.NFTX:
      case Markets.NFT20:
        return {
          contractAddress,
          traits,
          markets: [market],

          price: {
            low: minPrice,
            high: maxPrice,
            symbol: 'ETH',
          },
        }
      case 'others':
        return {
          contractAddress,
          traits,
          markets: allOtherMarkets,

          price: {
            low: minPrice,
            high: maxPrice,
            symbol: 'ETH',
          },
        }
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

  const { sortedAssets, sortedAssetsTotalEth } = useMemo(() => {
    if (!allAssetsFetched || !collectionAssets || !nftxCollectionAssets || !nft20CollectionAssets)
      return { sortedAssets: undefined, sortedAssetsTotalEth: BigNumber.from(0) }

    let counterNFTX = 0
    let counterNFT20 = 0

    let jointCollections = [...nftxCollectionAssets, ...nft20CollectionAssets]

    jointCollections.forEach((asset) => {
      if (!asset.susFlag) {
        const isNFTX = asset.marketplace === Markets.NFTX
        asset.priceInfo.ETHPrice = calcPoolPrice(asset, isNFTX ? counterNFTX : counterNFT20)
        BigNumber.from(asset.priceInfo.ETHPrice).gte(0) && (isNFTX ? counterNFTX++ : counterNFT20++)
      }
    })

    jointCollections = collectionAssets.concat(jointCollections)

    jointCollections.sort((a, b) => {
      return BigNumber.from(a.priceInfo.ETHPrice).gt(BigNumber.from(b.priceInfo.ETHPrice)) ? 1 : -1
    })

    let validAssets = jointCollections.filter(
      (asset) => BigNumber.from(asset.priceInfo.ETHPrice).gte(0) && !asset.susFlag
    )

    validAssets = validAssets.slice(
      0,
      Math.max(collectionAssets.length, nftxCollectionAssets.length, nft20CollectionAssets.length)
    )

    return {
      sortedAssets: validAssets,
      sortedAssetsTotalEth: validAssets.reduce(
        (total, asset) => total.add(BigNumber.from(asset.priceInfo.ETHPrice)),
        BigNumber.from(0)
      ),
    }
  }, [collectionAssets, nftxCollectionAssets, nft20CollectionAssets, allAssetsFetched])

  const { sweepItemsInBag, sweepEthPrice } = useMemo(() => {
    const sweepItemsInBag = itemsInBag
      .filter((item) => item.inSweep && item.asset.address === contractAddress)
      .map((item) => item.asset)

    const sweepEthPrice = sweepItemsInBag.reduce(
      (total, asset) => total.add(BigNumber.from(asset.priceInfo.ETHPrice)),
      BigNumber.from(0)
    )

    return { sweepItemsInBag, sweepEthPrice }
  }, [itemsInBag, contractAddress])

  useEffect(() => {
    if (sweepItemsInBag.length === 0) setSweepAmount('')
  }, [sweepItemsInBag])

  useEffect(() => {
    lockSweepItems(contractAddress)
  }, [contractAddress, traits, markets, minPrice, maxPrice, lockSweepItems])

  const clearSweep = () => {
    setSweepAmount('')
    removeAssetsFromBag(sweepItemsInBag)
  }

  const handleSweep = (value: number) => {
    if (sortedAssets) {
      if (isItemsToggled) {
        if (sweepItemsInBag.length < value) {
          addAssetsToBag(sortedAssets.slice(sweepItemsInBag.length, value), true)
        } else {
          removeAssetsFromBag(sweepItemsInBag.slice(value, sweepItemsInBag.length))
        }
        setSweepAmount(value < 1 ? '' : value.toString())
      } else {
        const wishValueInWei = parseEther(value.toString())
        if (sweepEthPrice.lte(wishValueInWei)) {
          let curIndex = sweepItemsInBag.length
          let curTotal = sweepEthPrice
          const wishAssets: GenieAsset[] = []

          while (
            curIndex < sortedAssets.length &&
            curTotal.add(BigNumber.from(sortedAssets[curIndex].priceInfo.ETHPrice)).lte(wishValueInWei)
          ) {
            wishAssets.push(sortedAssets[curIndex])
            curTotal = curTotal.add(BigNumber.from(sortedAssets[curIndex].priceInfo.ETHPrice))
            curIndex++
          }

          if (wishAssets.length > 0) {
            addAssetsToBag(wishAssets, true)
          }
        } else {
          let curIndex = sweepItemsInBag.length - 1
          let curTotal = sweepEthPrice
          const wishAssets: GenieAsset[] = []

          while (curIndex >= 0 && curTotal.gt(wishValueInWei)) {
            wishAssets.push(sweepItemsInBag[curIndex])
            curTotal = curTotal.sub(BigNumber.from(sweepItemsInBag[curIndex].priceInfo.ETHPrice))
            curIndex--
          }

          if (wishAssets.length > 0) {
            removeAssetsFromBag(wishAssets)
          }
        }

        setSweepAmount(value === 0 ? '' : value.toFixed(2))
      }
    }
  }

  const handleSliderChange = (value: number | number[]) => {
    if (typeof value === 'number') {
      if (sortedAssets) {
        if (isItemsToggled) {
          if (Math.floor(value) !== Math.floor(sweepAmount !== '' ? parseFloat(sweepAmount) : 0))
            handleSweep(Math.floor(value))
          setSweepAmount(value < 1 ? '' : value.toString())
        } else {
          handleSweep(value)
          setSweepAmount(value === 0 ? '' : value.toFixed(2))
        }
      }
    }
  }

  const handleInput = (value: string) => {
    if (value === '') {
      handleSweep(0)
      setSweepAmount('')
    } else if (isItemsToggled && wholeNumberRegex.test(value)) {
      handleSweep(parseFloat(value))
      setSweepAmount(value)
    } else if (!isItemsToggled && twoDecimalPlacesRegex.test(value)) {
      handleSweep(parseFloat(value))
      setSweepAmount(value)
    }
  }

  const handleToggleSweep = () => {
    clearSweep()
    toggleSweep()
  }

  return (
    <SweepContainer showSweep={showSweep}>
      <SweepLeftmostContainer>
        <SweepHeaderContainer>
          <ThemedText.SubHeaderSmall color="textPrimary" lineHeight="20px" paddingTop="6px" paddingBottom="6px">
            Sweep
          </ThemedText.SubHeaderSmall>
        </SweepHeaderContainer>
        <SweepSubContainer>
          <StyledSlider
            defaultValue={0}
            min={0}
            max={isItemsToggled ? sortedAssets?.length ?? 0 : parseFloat(formatEther(sortedAssetsTotalEth).toString())}
            value={isItemsToggled ? sweepItemsInBag.length : parseFloat(formatWeiToDecimal(sweepEthPrice.toString()))}
            step={isItemsToggled ? 1 : 0.01}
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
          <InputContainer
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            // text-specific options
            type="text"
            pattern="^[0-9]*[.,]?[0-9]*$"
            placeholder="0"
            minLength={1}
            maxLength={79}
            spellCheck="false"
            value={
              isItemsToggled ? (sweepAmount !== '' ? Math.floor(parseFloat(sweepAmount)) : sweepAmount) : sweepAmount
            }
            onChange={(event) => {
              handleInput(event.target.value.replace(/,/g, '.'))
            }}
          />
          <ToggleContainer onClick={handleToggleSweep}>
            <ToggleSwitch active={isItemsToggled}>Items</ToggleSwitch>
            <ToggleSwitch active={!isItemsToggled}>ETH</ToggleSwitch>
          </ToggleContainer>
        </SweepSubContainer>
      </SweepLeftmostContainer>
      <SweepRightmostContainer>
        <ThemedText.SubHeader font-size="14px">{`${formatWeiToDecimal(
          sweepEthPrice.toString()
        )} ETH`}</ThemedText.SubHeader>
        <NftDisplay nfts={sweepItemsInBag} />
      </SweepRightmostContainer>
    </SweepContainer>
  )
}
