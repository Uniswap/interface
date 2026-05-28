import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CreateAuctionContextProvider } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { CreateAuctionFormWrapper } from '~/pages/Liquidity/CreateAuction/CreateAuctionFormWrapper'
import { CreateAuctionSteps } from '~/pages/Liquidity/CreateAuction/CreateAuctionSteps'

export function CreateAuction() {
  return (
    <Trace logImpression page={InterfacePageName.LaunchAuctionPage}>
      <CreateAuctionContextProvider>
        <CreateAuctionFormWrapper>
          <CreateAuctionSteps />
        </CreateAuctionFormWrapper>
      </CreateAuctionContextProvider>
    </Trace>
  )
}

export default CreateAuction
