import { useWeb3React } from '@web3-react/core'
import { Box } from 'nft/components/Box'
import { Center, Column, Row } from 'nft/components/Flex'
import { ChevronLeftIcon, XMarkIcon } from 'nft/components/icons'
import { ListPage } from 'nft/components/sell/list/ListPage'
import { SelectPage } from 'nft/components/sell/select/SelectPage'
import { buttonMedium, header2, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useNFTList, useSellAsset, useSellPageState, useWalletCollections } from 'nft/hooks'
import { ListingStatus, SellPageStateType } from 'nft/types'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToggleWalletModal } from 'state/application/hooks'

import * as styles from './sell.css'

const SHOPPING_BAG_WIDTH = 324

const Sell = () => {
  const sellPageState = useSellPageState((state) => state.state)
  const setSellPageState = useSellPageState((state) => state.setSellPageState)
  const removeAllMarketplaceWarnings = useSellAsset((state) => state.removeAllMarketplaceWarnings)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const navigate = useNavigate()

  useEffect(() => {
    removeAllMarketplaceWarnings()
    setListingStatus(ListingStatus.DEFINED)
  }, [removeAllMarketplaceWarnings, sellPageState, setListingStatus])

  const { account } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal()

  useEffect(() => {
    resetSellAssets()
    setSellPageState(SellPageStateType.SELECTING)
    clearCollectionFilters()
  }, [account, resetSellAssets, setSellPageState, clearCollectionFilters])
  const cartExpanded = useBag((state) => state.bagExpanded)

  const exitSellFlow = () => {
    navigate(-1)
  }

  return (
    <Box className={styles.mobileSellWrapper}>
      {/* <Head> TODO: figure out metadata tagging
          <title>Genie | Sell</title>
        </Head> */}
      <Row className={styles.mobileSellHeader}>
        {sellPageState === SellPageStateType.LISTING && (
          <Box marginRight="4" onClick={() => setSellPageState(SellPageStateType.SELECTING)}>
            <ChevronLeftIcon height={28} width={28} />
          </Box>
        )}
        <Box className={headlineSmall} paddingBottom="4" style={{ lineHeight: '28px' }}>
          {sellPageState === SellPageStateType.SELECTING ? 'Select NFTs' : 'Create Listing'}
        </Box>
        <Box cursor="pointer" marginLeft="auto" marginRight="0" onClick={exitSellFlow}>
          <XMarkIcon height={28} width={28} fill={themeVars.colors.blackBlue} />
        </Box>
      </Row>
      {account != null ? (
        <Box style={{ width: `calc(100% - ${cartExpanded ? SHOPPING_BAG_WIDTH : 0}px)` }}>
          {sellPageState === SellPageStateType.SELECTING ? <SelectPage /> : <ListPage />}
        </Box>
      ) : (
        <Column as="section" gap="60" className={styles.section}>
          <div style={{ minHeight: '70vh' }}>
            <Center className={styles.notConnected} flexDirection="column">
              <Box as="span" className={header2} color="darkGray" marginBottom="24" display="block">
                No items to display
              </Box>
              <Box as="button" className={buttonMedium} onClick={toggleWalletModal}>
                Connect Wallet
              </Box>
            </Center>
          </div>
        </Column>
      )}
    </Box>
  )
}

export default Sell
