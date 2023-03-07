import 'rc-slider/assets/index.css'

import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName, NFTFilterTypes } from '@uniswap/analytics-events'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { NumericInput } from 'nft/components/layout/Input'
import { body } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { usePriceRange } from 'nft/hooks/usePriceRange'
import { TraitPosition } from 'nft/hooks/useTraitsOpen'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { default as Slider } from 'rc-slider'
import { FocusEventHandler, FormEvent, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { darkTheme } from 'theme/colors'

import * as styles from './PriceRange.css'
import { TraitsHeader } from './TraitsHeader'

const StyledSlider = styled(Slider)`
  cursor: pointer;
`

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
  const theme = useTheme()

  const location = useLocation()

  useEffect(() => {
    setMinPrice('')
    setMaxPrice('')
    setPriceRangeLow('')
    setPriceRangeHigh('')
  }, [location.pathname, setMinPrice, setMaxPrice, setPriceRangeLow, setPriceRangeHigh])

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setPlaceholderText(e.currentTarget.placeholder)
    e.currentTarget.placeholder = ''
  }

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    e.currentTarget.placeholder = placeholderText
    setPlaceholderText('')
    if (minPrice || maxPrice)
      sendAnalyticsEvent(NFTEventName.NFT_FILTER_SELECTED, { filter_type: NFTFilterTypes.PRICE_RANGE })
  }

  const updateMinPriceRange = (v: FormEvent<HTMLInputElement>) => {
    const [, prevMax] = prevMinMax

    // if there is actually a number, update the slider place
    if (v.currentTarget.value) {
      // we are calculating the new slider position here
      const diff = parseInt(v.currentTarget.value) - parseInt(priceRangeLow)
      const newLow = Math.floor(100 * (diff / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

      // if the slider min value is larger than or equal to the max, we don't want it to move past the max
      // so we put the sliders on top of each other
      // if it is less than, we can move it
      if (parseInt(v.currentTarget.value) >= parseInt(maxPrice)) {
        setPrevMinMax([prevMax, prevMax])
      } else {
        setPrevMinMax([newLow, prevMax])
      }
    } else {
      // if there is no number, reset the slider position
      setPrevMinMax([0, prevMax])
    }

    // set min price for price range querying
    setMinPrice(v.currentTarget.value.toString())
    scrollToTop()
  }

  const updateMaxPriceRange = (v: FormEvent<HTMLInputElement>) => {
    const [prevMin] = prevMinMax

    if (v.currentTarget.value) {
      const range = parseInt(priceRangeHigh) - parseInt(v.currentTarget.value)
      const newMax = Math.floor(100 - 100 * (range / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

      if (parseInt(v.currentTarget.value) <= parseInt(minPrice)) {
        setPrevMinMax([prevMin, prevMin])
      } else {
        setPrevMinMax([prevMin, newMax])
      }
    } else {
      setPrevMinMax([prevMin, 100])
    }

    setMaxPrice(v.currentTarget.value)
    scrollToTop()
  }

  const handleSliderLogic = (minMax: number | Array<number>) => {
    if (typeof minMax === 'number') return

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
      <Row marginTop="12" color="textPrimary" justifyContent="space-between">
        <Row position="relative">
          <NumericInput
            style={{
              width: '126px',
            }}
            className={styles.priceInput}
            placeholder={priceRangeLow}
            onChange={updateMinPriceRange}
            onFocus={handleFocus}
            value={minPrice}
            onBlur={handleBlur}
          />
        </Row>
        <Box className={body}>to</Box>
        <Row position="relative">
          <NumericInput
            style={{
              width: '126px',
            }}
            className={styles.priceInput}
            placeholder={priceRangeHigh}
            value={maxPrice}
            onChange={updateMaxPriceRange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Row>
      </Row>

      <Row marginTop="24" marginBottom="12" paddingLeft="8" paddingRight="8">
        <StyledSlider
          defaultValue={[0, 100]}
          min={0}
          max={100}
          range
          step={0.0001}
          value={prevMinMax}
          trackStyle={{
            top: '3px',
            height: '8px',
            background: `${theme.accentAction}`,
          }}
          handleStyle={{
            top: '3px',
            width: '12px',
            height: '20px',
            opacity: '1',
            backgroundColor: `white`,
            borderRadius: '4px',
            border: 'none',
            boxShadow: darkTheme.shallowShadow.slice(0, -1),
          }}
          railStyle={{
            top: '3px',
            height: '8px',
            backgroundColor: `${theme.accentActionSoft}`,
          }}
          onChange={handleSliderLogic}
        />
      </Row>
    </TraitsHeader>
  )
}
