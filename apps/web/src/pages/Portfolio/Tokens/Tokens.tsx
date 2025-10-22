import { useAccount } from 'hooks/useAccount'
import { useTransformTokenTableData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import TokensTable from 'pages/Portfolio/Tokens/Table/Table'
import { TokensAllocationChart } from 'pages/Portfolio/Tokens/Table/TokensAllocationChart'
import { Flex } from 'ui/src'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export default function PortfolioTokens() {
  const account = useAccount()
  const tokenData = useTransformTokenTableData()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioTokensPage}>
      {account.address && (
        <Flex flexDirection="column" gap="$spacing16">
          <PortfolioBalance owner={account.address} />

          <TokensAllocationChart tokenData={tokenData} />

          <TokensTable tokenData={tokenData} />
        </Flex>
      )}
    </Trace>
  )
}
