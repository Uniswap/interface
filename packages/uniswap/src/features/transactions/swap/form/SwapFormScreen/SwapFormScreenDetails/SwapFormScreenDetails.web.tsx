import { Flex } from '@universe/mycelium'
import { memo, useState } from 'react'
import { GeoRestrictionCard } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionCard'
import { GeoRestrictionModalStoreContextProvider } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionModalStoreContextProvider'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButton'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { SwapFormWarningStoreContextProvider } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/SwapFormWarningStoreContextProvider'
import { ExpandableRows } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/ExpandableRows'
import { SwapFormPermissionedWarningCard } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormPermissionedWarningCard'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/SwapFormScreenFooter'
import { SwapFormWarningModals } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals/SwapFormWarningModals'

export const SwapFormScreenDetails = memo(function SwapFormScreenDetails(): JSX.Element {
  const { tokenColor, showFooter } = useSwapFormScreenStore((state) => ({
    tokenColor: state.tokenColor,
    showFooter: state.showFooter,
  }))
  // Shared by the gas toggle in the footer and the ExpandableRows below it; other rows sit between them.
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  return (
    <GeoRestrictionModalStoreContextProvider>
      <Flex gap="$spacing8">
        <Flex overflow="hidden">
          <Flex className="gas-container">
            {/* The HeightAnimator attaches an absolutely positioned element that cannot be targeted without the below style */}
            <style>{`
              .gas-container > div > div {
                width: 100%;
              }
            `}</style>
            <Flex>
              <Flex gap="$spacing8">
                <SwapFormWarningStoreContextProvider>
                  <SwapFormButton tokenColor={tokenColor} />
                  <SwapFormPermissionedWarningCard />
                  <SwapFormWarningModals />
                </SwapFormWarningStoreContextProvider>
              </Flex>
              <SwapFormScreenFooter detailsExpanded={detailsExpanded} onDetailsExpandedChange={setDetailsExpanded} />
            </Flex>
            {showFooter ? <ExpandableRows expanded={detailsExpanded} /> : null}
          </Flex>
        </Flex>
        <GeoRestrictionCard />
      </Flex>
    </GeoRestrictionModalStoreContextProvider>
  )
})
