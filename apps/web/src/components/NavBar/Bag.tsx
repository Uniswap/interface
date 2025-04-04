import { NavIcon } from 'components/NavBar/NavIcon'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { BagIcon, TagIcon } from 'nft/components/icons'
import { useBag, useSellAsset } from 'nft/hooks'
import { useCallback } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'

const CounterDot = styled(Flex, {
  position: 'absolute',
  right: 0,
  top: '$spacing4',
  backgroundColor: '$accent1',
  borderRadius: '$roundedFull',
  height: '16px',
  width: '16px',
  justifyContent: 'center',
  alignItems: 'center',
})

export const Bag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const isProfilePage = useIsPage(PageType.NFTS_PROFILE)

  const { bagExpanded, setBagExpanded } = useBag(({ bagExpanded, setBagExpanded }) => ({ bagExpanded, setBagExpanded }))

  const handleIconClick = useCallback(() => {
    setBagExpanded({ bagExpanded: !bagExpanded })
  }, [bagExpanded, setBagExpanded])

  const bagQuantity = isProfilePage ? sellAssets.length : itemsInBag.length
  const bagHasItems = bagQuantity > 0

  return (
    <NavIcon isActive={bagExpanded} onClick={handleIconClick}>
      {isProfilePage ? (
        <TagIcon viewBox="0 0 24 24" width={24} height={24} />
      ) : (
        <BagIcon viewBox="0 0 24 24" width={24} height={24} strokeWidth="2px" />
      )}
      {bagHasItems && (
        <CounterDot>
          {bagQuantity > 99 ? (
            <MoreHorizontal color="white" />
          ) : (
            <Text color="$white" fontSize={10}>
              {bagQuantity}
            </Text>
          )}
        </CounterDot>
      )}
    </NavIcon>
  )
}
