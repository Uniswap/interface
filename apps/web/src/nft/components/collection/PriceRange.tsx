import 'rc-slider/assets/index.css'

import { NFTEventName, NFTFilterTypes } from '@uniswap/analytics-events'
import { TraitsHeader } from 'nft/components/collection/TraitsHeader'
import { NumericInput } from 'nft/components/layout/Input'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { usePriceRange } from 'nft/hooks/usePriceRange'
import { TraitPosition } from 'nft/hooks/useTraitsOpen'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { default as Slider } from 'rc-slider'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { darkDeprecatedTheme } from 'theme/deprecatedColors'
import { Flex, Text, useSporeColors } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export const PriceRange = () => {
  const [placeholderText, setPlaceholderText] = useState('')
  const setMinPrice = useCollectionFilters((state) => state.setMinPrice)
  const setMaxPrice = useCollectionFilters((state) => state.setMaxPrice)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const priceRangeLow = usePriceRange((state) => state.priceRangeLow)
  const priceRangeHigh = usePriceRange((state) => state.priceRangeHigh)
  const setPriceRangeLow = usePriceRange((statae) => statae.setPriceRangeLow)
  const setPriceRangeHigh = usePriceRange((statae) => statae.setPriceRangeHigh)
  const prevMinMax = usePriceRange((state) => state.prevMinMax)
  const setPrevMinMax = usePriceRange((state) => state.setPrevMinMax)
  const colors = useSporeColors()

  const location = useLocation()

  useEffect(() => {
    setMinPrice('')
    setMaxPrice('')
    setPriceRangeLow('')
    setPriceRangeHigh('')
  }, [location.pathname, setMinPrice, setMaxPrice, setPriceRangeLow, setPriceRangeHigh])

  const handleFocus = (e: any) => {
    setPlaceholderText(e.currentTarget.placeholder)
    e.currentTarget.placeholder = ''
  }

  const handleBlur = (e: any) => {
    e.currentTarget.placeholder = placeholderText
    setPlaceholderText('')
    if (minPrice || maxPrice) {
      sendAnalyticsEvent(NFTEventName.NFT_FILTER_SELECTED, { filter_type: NFTFilterTypes.PRICE_RANGE })
    }
  }

  const updateMinPriceRange = (v: string) => {
    const [, prevMax] = prevMinMax

    // if there is actually a number, update the slider place
    if (v) {
      // we are calculating the new slider position here
      const diff = parseInt(v) - parseInt(priceRangeLow)
      const newLow = Math.floor(100 * (diff / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

      // if the slider min value is larger than or equal to the max, we don't want it to move past the max
      // so we put the sliders on top of each other
      // if it is less than, we can move it
      if (parseInt(v) >= parseInt(maxPrice)) {
        setPrevMinMax([prevMax, prevMax])
      } else {
        setPrevMinMax([newLow, prevMax])
      }
    } else {
      // if there is no number, reset the slider position
      setPrevMinMax([0, prevMax])
    }

    // set min price for price range querying
    setMinPrice(v)
    scrollToTop()
  }

  const updateMaxPriceRange = (v: string) => {
    const [prevMin] = prevMinMax

    if (v) {
      const range = parseInt(priceRangeHigh) - parseInt(v)
      const newMax = Math.floor(100 - 100 * (range / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

      if (parseInt(v) <= parseInt(minPrice)) {
        setPrevMinMax([prevMin, prevMin])
      } else {
        setPrevMinMax([prevMin, newMax])
      }
    } else {
      setPrevMinMax([prevMin, 100])
    }

    setMaxPrice(v)
    scrollToTop()
  }

  const handleSliderLogic = (minMax: number | Array<number>) => {
    if (typeof minMax === 'number') {
      return
    }

    const [newMin, newMax] = minMax

    // strip commas so parseFloat can parse properly
    const priceRangeHighNumber = parseFloat(priceRangeHigh.replace(/,/g, ''))
    const priceRangeLowNumber = parseFloat(priceRangeLow.replace(/,/g, ''))
    const diff = priceRangeHighNumber - priceRangeLowNumber

    // minprice
    const minChange = newMin / 100
    const newMinPrice = minChange * diff + priceRangeLowNumber

    // max price
    const maxChange = (100 - newMax) / 100
    const newMaxPrice = priceRangeHighNumber - maxChange * diff

    setMinPrice(newMinPrice.toFixed(2).toString())
    setMaxPrice(newMaxPrice.toFixed(2).toString())

    // set back to placeholder when they move back to end of range
    if (newMin === 0) {
      setMinPrice('')
    }
    if (newMax === 100) {
      setMaxPrice('')
    }

    // update the previous minMax for future checks
    setPrevMinMax(minMax)
  }

  return (
    <TraitsHeader title="Price range" index={TraitPosition.PRICE_RANGE_INDEX}>
      <Flex row mt="$spacing12" justifyContent="space-between" alignItems="center">
        <Flex position="relative">
          <NumericInput
            width={126}
            p="$padding12"
            borderRadius="$rounded12"
            backgroundColor="$transparent"
            borderColor="$transparent"
            borderWidth={1.5}
            placeholder={priceRangeLow}
            onChangeText={updateMinPriceRange}
            value={minPrice}
            onFocus={handleFocus}
            onBlur={handleBlur}
            color="$neutral1"
            placeholderTextColor="$neutral2"
            hoverStyle={{ borderColor: '$neutral2' }}
          />
        </Flex>
        <Text color="$neutral1" variant="body2">
          to
        </Text>
        <Flex row>
          <NumericInput
            width={126}
            p="$padding12"
            borderRadius="$rounded12"
            backgroundColor="$transparent"
            borderColor="$transparent"
            borderWidth={1.5}
            placeholder={priceRangeHigh}
            value={maxPrice}
            onChangeText={updateMaxPriceRange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            color="$neutral1"
            placeholderTextColor="$neutral2"
            hoverStyle={{ borderColor: '$neutral2' }}
          />
        </Flex>
      </Flex>

      <Flex mt="$spacing24" mb="$spacing12" pl="$spacing8" pr="$spacing8">
        <Slider
          defaultValue={[0, 100]}
          min={0}
          max={100}
          range
          step={0.0001}
          value={prevMinMax}
          style={{
            cursor: 'pointer',
          }}
          trackStyle={{
            top: '3px',
            height: '8px',
            background: `${colors.accent1.val}`,
            cursor: 'pointer',
          }}
          handleStyle={{
            top: '3px',
            width: '12px',
            height: '20px',
            opacity: '1',
            backgroundColor: `white`,
            borderRadius: '4px',
            border: 'none',
            boxShadow: darkDeprecatedTheme.deprecated_shallowShadow.slice(0, -1),
            cursor: 'pointer',
          }}
          railStyle={{
            top: '3px',
            height: '8px',
            backgroundColor: `${colors.accent2.val}`,
          }}
          onChange={handleSliderLogic}
        />
      </Flex>
    </TraitsHeader>
  )
}
