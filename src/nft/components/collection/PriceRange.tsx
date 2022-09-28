import { useIsMobile } from 'nft/hooks'
import { useCollectionFilters } from 'nft/hooks/useCollectionFilters'
import { useEffect, useState, FormEvent } from 'react'
import { FocusEventHandler } from 'react'
import { useLocation } from 'react-router-dom'
import * as styles from 'nft/components/collection/Filters.css'
import { subheadSmall } from 'nft/css/common.css'
import { Box } from 'nft/components/Box'
import clsx from 'clsx'
import { ChevronUpIcon } from 'nft/components/icons'
import { Row } from 'nft/components/Flex'
import { NumericInput } from 'nft/components/layout/Input'
import { isNumber } from 'nft/utils/numbers'
import { scrollToTop } from 'nft/utils/scrollToTop'

export const PriceRange = () => {
  const [placeholderText, setPlaceholderText] = useState('')
  const setMinPrice = useCollectionFilters((state) => state.setMinPrice)
  const setMaxPrice = useCollectionFilters((state) => state.setMaxPrice)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const isMobile = useIsMobile()

  const [isOpen, setOpen] = useState(false)

  const location = useLocation()

  useEffect(() => {
    setMinPrice('')
    setMaxPrice('')
  }, [location.pathname, setMinPrice, setMaxPrice])

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setPlaceholderText(e.currentTarget.placeholder)
    e.currentTarget.placeholder = ''
  }

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    e.currentTarget.placeholder = placeholderText
    setPlaceholderText('')
  }

  return (
    <Box
      as="details"
      className={clsx(subheadSmall, !isOpen && styles.rowHover, isOpen && styles.detailsOpen)}
      style={{ borderTop: '1px solid #99A1BD3D' }}
      open={isOpen}
    >
      <Box
        as="summary"
        className={clsx(isOpen && styles.summaryOpen, isOpen ? styles.rowHoverOpen : styles.rowHover)}
        display="flex"
        justifyContent="space-between"
        cursor="pointer"
        alignItems="center"
        fontSize="14"
        paddingTop="8"
        paddingLeft="12"
        paddingRight="12"
        paddingBottom="8"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!isOpen)
        }}
      >
        Price range
        <Box
          color="textSecondary"
          transition="250"
          height="28"
          width="28"
          style={{
            transform: `rotate(${isOpen ? 0 : 180}deg)`,
          }}
        >
          <ChevronUpIcon />
        </Box>
      </Box>
      <Row gap="12" marginTop="12" color="textPrimary">
        <Row position="relative" style={{ flex: 1 }}>
          <NumericInput
            style={{
              width: isMobile ? '100%' : '142px',
              border: '2px solid rgba(153, 161, 189, 0.24)',
            }}
            borderRadius="12"
            padding="12"
            fontSize="14"
            color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
            backgroundColor="transparent"
            placeholder="Min"
            defaultValue={minPrice}
            onChange={(v: FormEvent<HTMLInputElement>) => {
              scrollToTop()
              setMinPrice(isNumber(v.currentTarget.value) ? parseFloat(v.currentTarget.value) : '')
            }}
            onFocus={handleFocus}
            value={minPrice}
            onBlur={handleBlur}
          />
        </Row>
        <Row position="relative" style={{ flex: 1 }}>
          <NumericInput
            style={{
              width: isMobile ? '100%' : '142px',
              border: '2px solid rgba(153, 161, 189, 0.24)',
            }}
            borderColor={{ default: 'backgroundOutline', focus: 'textSecondary' }}
            borderRadius="12"
            padding="12"
            fontSize="14"
            color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
            backgroundColor="transparent"
            placeholder="Max"
            defaultValue={maxPrice}
            value={maxPrice}
            onChange={(v: FormEvent<HTMLInputElement>) => {
              scrollToTop()
              setMaxPrice(isNumber(v.currentTarget.value) ? parseFloat(v.currentTarget.value) : '')
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Row>
      </Row>
    </Box>
  )

  // return (
  // <Row gap="12" marginTop="12" color="textPrimary">
  //   <Row position="relative" style={{ flex: 1 }}>
  //     <NumericInput
  //       style={{
  //         width: isMobile ? '100%' : '142px',
  //         border: '2px solid rgba(153, 161, 189, 0.24)',
  //       }}
  //       borderRadius="12"
  //       padding="12"
  //       fontSize="14"
  //       color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
  //       backgroundColor="transparent"
  //       placeholder="Min"
  //       defaultValue={minPrice}
  //       onChange={(v: FormEvent<HTMLInputElement>) => {
  //         scrollToTop()
  //         setMinPrice(isNumber(v.currentTarget.value) ? parseFloat(v.currentTarget.value) : '')
  //       }}
  //       onFocus={handleFocus}
  //       value={minPrice}
  //       onBlur={handleBlur}
  //     />
  //   </Row>
  //   <Row position="relative" style={{ flex: 1 }}>
  //     <NumericInput
  //       style={{
  //         width: isMobile ? '100%' : '142px',
  //         border: '2px solid rgba(153, 161, 189, 0.24)',
  //       }}
  //       borderColor={{ default: 'backgroundOutline', focus: 'textSecondary' }}
  //       borderRadius="12"
  //       padding="12"
  //       fontSize="14"
  //       color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
  //       backgroundColor="transparent"
  //       placeholder="Max"
  //       defaultValue={maxPrice}
  //       value={maxPrice}
  //       onChange={(v: FormEvent<HTMLInputElement>) => {
  //         scrollToTop()
  //         setMaxPrice(isNumber(v.currentTarget.value) ? parseFloat(v.currentTarget.value) : '')
  //       }}
  //       onFocus={handleFocus}
  //       onBlur={handleBlur}
  //     />
  //   </Row>
  // </Row>
  // )
}
