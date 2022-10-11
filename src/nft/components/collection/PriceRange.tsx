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
  const prevMinMax = usePriceRange((state) => state.prevMinMax)
  const setPrevMinMax = usePriceRange((state) => state.setPrevMinMax)
  const isDarktheme = useIsDarkMode()

  const isMobile = useIsMobile()
  const location = useLocation()

  useEffect(() => {
    setMinPrice('')
    setMaxPrice('')
    setPriceRangeLow('')
    setPriceRangeHigh('')
    setPrevMinMax([0, 100])
  }, [location.pathname])

  console.log('price range')
  console.log(priceRangeLow)
  console.log(priceRangeHigh)
  console.log(minPrice)
  console.log(maxPrice)

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
              const [, prevMax] = prevMinMax

              if (v.currentTarget.value) {
                const range = parseInt(v.currentTarget.value) - parseInt(priceRangeLow)
                const newLow = Math.floor(100 * (range / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

                if (parseInt(v.currentTarget.value) > parseInt(maxPrice)) {
                  setPrevMinMax([prevMax, prevMax])
                } else {
                  setPrevMinMax([newLow, prevMax])
                }
              } else {
                setPrevMinMax([0, prevMax])
              }

              setMinPrice(v.currentTarget.value)

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
              const [prevMin] = prevMinMax

              if (v.currentTarget.value) {
                const range = parseInt(priceRangeHigh) - parseInt(v.currentTarget.value)
                const newMax = Math.floor(100 - 100 * (range / (parseInt(priceRangeHigh) - parseInt(priceRangeLow))))

                if (parseInt(v.currentTarget.value) < parseInt(minPrice)) {
                  setPrevMinMax([prevMin, prevMin])
                } else {
                  setPrevMinMax([prevMin, newMax])
                }
              } else {
                setPrevMinMax([prevMin, 100])
              }

              setMaxPrice(v.currentTarget.value)
              scrollToTop()
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Row>
      </Row>

      <Row marginBottom="20" paddingLeft="8" paddingRight="8">
        <ReactSlider
          disabled={!priceRangeLow || !priceRangeHigh}
          defaultValue={[0, 100]}
          value={prevMinMax}
          className={isDarktheme ? styles.sliderDark : styles.sliderLight}
          trackClassName={styles.tracker}
          thumbClassName={styles.thumb}
          onAfterChange={(minMax: Array<number>) => {
            const [newMin, newMax] = minMax
            const [prevMin, prevMax] = prevMinMax
            const priceRangeHighNumber = parseFloat(priceRangeHigh.replace(/,/g, ''))
            const priceRangeLowNumber = parseFloat(priceRangeLow.replace(/,/g, ''))

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
            if (newMin === 0) {
              setMinPrice('')
            }
            if (newMax === 100) {
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
