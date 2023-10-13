import { Box, H2 } from "../components/Generics";
import { DocumentationCard } from "../components/cards/DocumentationCard";
import { DownloadWalletCard } from "../components/cards/DownloadWalletCard";
import { LiquidityCard } from "../components/cards/LiquidityCard";
import { WebappCard } from "../components/cards/WebappCard";

export function DirectToDefi() {
  return (
    <Box direction="column" align="center" padding="0 24px">
      {/* Go direct to Defi */}
      <Box direction="column" gap="108px" maxWidth="1328px">
        <H2>Go direct to DeFi</H2>
        <Box direction="row" gap="24px">
          <Box direction="column" gap="24px">
            <WebappCard />
            <DocumentationCard />
          </Box>
          <Box direction="column" gap="24px">
            <LiquidityCard />
            <DownloadWalletCard />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
