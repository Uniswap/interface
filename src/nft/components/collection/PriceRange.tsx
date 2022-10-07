import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { NumericInput } from 'nft/components/layout/Input'
import { useIsMobile } from 'nft/hooks'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { usePriceRange } from 'nft/hooks/usePriceRange'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { FormEvent, useEffect, useState } from 'react'
import { FocusEventHandler } from 'react'
import { useLocation } from 'react-router-dom'
import ReactSlider from 'react-slider'
import { useIsDarkMode } from 'state/user/hooks'

import * as styles from './PriceRange.css'
import { TraitsHeader } from './TraitsHeader'

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
  const [prevMinMax, setPrevMinMax] = useState([0, 100])
  const [minSet, setMinSet] = useState(false)
  const [maxSet, setMaxSet] = useState(false)
  const isDarktheme = useIsDarkMode()

  const isMobile = useIsMobile()

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
  }

  return (
    <TraitsHeader title="Price range">
      <Row gap="12" marginTop="12" color="textPrimary">
        <Row position="relative">
          <NumericInput
            style={{
              width: isMobile ? '100%' : '126px',
              border: '2px solid rgba(153, 161, 189, 0.24)',
            }}
            borderRadius="12"
            padding="12"
            fontSize="14"
            color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
            backgroundColor="transparent"
            placeholder={`${priceRangeLow}`}
            onChange={(v: FormEvent<HTMLInputElement>) => {
              // If a value is manually changed, reset the sliders.
              setPrevMinMax([0, 100])

              // set the value of minprice and range for querying
              setMinPrice(v.currentTarget.value)
              setPriceRangeLow(v.currentTarget.value)

              // If we are updating the min price and the max price has been adjusted via the slider
              // We need to maintain that min price when we reset
              if (maxPrice !== '') {
                setMaxSet(true)
                setPriceRangeHigh(maxPrice)
              }

              // if the user manually inputs a value, we want this value to persist when moving a slider
              // back to the start state
              setMinSet(v.currentTarget.value !== '')

              scrollToTop()
            }}
            onFocus={handleFocus}
            value={minPrice}
            onBlur={handleBlur}
          />
        </Row>
        <Box color="textPrimary" fontSize="16">
          to
        </Box>

        <Row position="relative" style={{ flex: 1 }}>
          <NumericInput
            style={{
              width: isMobile ? '100%' : '126px',
              border: '2px solid rgba(153, 161, 189, 0.24)',
            }}
            borderColor={{ default: 'backgroundOutline', focus: 'textSecondary' }}
            borderRadius="12"
            padding="12"
            fontSize="14"
            color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
            backgroundColor="transparent"
            placeholder={priceRangeHigh}
            value={maxPrice}
            onChange={(v: FormEvent<HTMLInputElement>) => {
              // See above comments for explanation on code logic
              setPrevMinMax([0, 100])
              setMaxPrice(v.currentTarget.value)
              setPriceRangeHigh(v.currentTarget.value)
              setMaxSet(v.currentTarget.value !== '')

              if (minPrice !== '') {
                setMinSet(true)
                setPriceRangeLow(minPrice)
              }

              scrollToTop()
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Row>
      </Row>

      <Row marginBottom="20" paddingLeft="8" paddingRight="8">
        <ReactSlider
          disabled={!(priceRangeLow || !priceRangeHigh)}
          defaultValue={[0, 100]}
          disabled={!(minPrice || !maxPrice)}
          value={prevMinMax}
          className={isDarktheme ? styles.sliderDark : styles.sliderLight}
          trackClassName={styles.tracker}
          thumbClassName={styles.thumb}
          onAfterChange={(minMax: Array<number>) => {
            const [newMin, newMax] = minMax
            const [prevMin, prevMax] = prevMinMax
            const priceRangeHighNumber = parseFloat(priceRangeHigh)
            const priceRangeLowNumber = parseFloat(priceRangeLow)

            const diff = priceRangeHighNumber - priceRangeLowNumber

            // This logic checks to see if the slider was actually moved
            // Otherwise we don't want to update the minprice
            // Similar logic for max
            if (newMin !== prevMin) {
              const minChange = newMin / 100
              const newMinPrice = minChange * diff + priceRangeLowNumber

              setMinPrice(newMinPrice.toFixed(2))
            }

            if (newMax !== prevMax) {
              const maxChange = (100 - newMax) / 100
              const newMaxPrice = priceRangeHighNumber - maxChange * diff

              setMaxPrice(newMaxPrice.toFixed(2))
            }

            // if they move the slider back to the beginning and have NOT manually set a value, reset the minprice.
            // Similar logic for max
            if (newMin === 0 && !minSet) {
              setMinPrice('')
            }
            if (newMax === 100 && !maxSet) {
              setMaxPrice('')
            }

            // update the previous minMax for future checks
            setPrevMinMax(minMax)
          }}
        />
      </Row>
    </TraitsHeader>
  )
}
