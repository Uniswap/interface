import { FilterDropdown, FilterItem } from 'nft/components/collection/MarketplaceSelect'
import { useState } from 'react'

export const FilterSortDropdown = () => {
  const [isOpen, setOpen] = useState(false)
  const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault()
    setOpen(!isOpen)
    // setTraitsOpen(TraitPosition.MARKPLACE_INDEX, !isOpen)set sortby TODO: do I not need?
  }
  const sortItems = new Array(4).fill(<>test</>)
  return <FilterDropdown title={'Sort by'} items={sortItems} onClick={onClick} isOpen={isOpen} />
}

const SortByItems = ({
  title,
  addMarket,
  removeMarket,
  isMarketSelected,
  count,
}: {
  title: string
  addMarket: (market: string) => void
  removeMarket: (market: string) => void
  isMarketSelected: boolean
  count?: number
}) => {
  const checkMark = <></> // if is selected show otherwise nothing
  const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault()
  }
  return <FilterItem title={title} element={checkMark} onClick={onClick} key={title} />
}

// const MarketplaceItem = ({
//   title,
//   value,
//   addMarket,
//   removeMarket,
//   isMarketSelected,
//   count,
// }: {
//   title: string
//   value: string
//   addMarket: (market: string) => void
//   removeMarket: (market: string) => void
//   isMarketSelected: boolean
//   count?: number
// }) => {
//   const [isCheckboxSelected, setCheckboxSelected] = useState(false)
//   const [hovered, toggleHover] = useReducer((state) => !state, false)
//   useEffect(() => {
//     setCheckboxSelected(isMarketSelected)
//   }, [isMarketSelected])
//   const handleCheckbox = (e: FormEvent) => {
//     e.preventDefault()
//     if (!isCheckboxSelected) {
//       addMarket(value)
//       setCheckboxSelected(true)
//     } else {
//       removeMarket(value)
//       setCheckboxSelected(false)
//     }
//     sendAnalyticsEvent(EventName.NFT_FILTER_SELECTED, { filter_type: FilterTypes.MARKETPLACE })
//   }

//   const checkbox = (
//     <Checkbox checked={isCheckboxSelected} hovered={hovered} onChange={handleCheckbox}>
//       <Box as="span" color="textSecondary" marginLeft="4" paddingRight={'12'}>
//         {count}
//       </Box>
//     </Checkbox>
//   )

//   return (
//     <div key={value} onMouseEnter={toggleHover} onMouseLeave={toggleHover}>
//       <FilterItem title={title} element={checkbox} onClick={handleCheckbox} />
//     </div>
//   )
// }
