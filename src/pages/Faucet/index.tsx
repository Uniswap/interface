import { Token } from "@uniswap/sdk-core"
import { useWeb3React } from "@web3-react/core"
import { AutoColumn } from "components/Column"
import { SupportedChainId } from "constants/chains"
import { FakeTokensMapMumbai, FakeTokensMapSepolia, FakeTokens_MUMBAI, FakeTokens_SEPOLIA } from "constants/fake-tokens"
import { useFaucetCallback } from "hooks/useApproveCallback"
import { MaxButton } from "pages/Pool/styleds"
import { SmallMaxButton } from "pages/RemoveLiquidity/styled"
import { useCallback } from "react"
import styled from "styled-components"
import { ThemedText } from "theme"

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 870px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 500px;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const FaucetsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
`

export default function FaucetsPage() {
  const {chainId} = useWeb3React()

  const FakeTokens = chainId === SupportedChainId.SEPOLIA ? FakeTokens_SEPOLIA : FakeTokens_MUMBAI
  return (
    <PageWrapper>
      <AutoColumn>
        <ThemedText.HeadlineLarge>Faucet</ThemedText.HeadlineLarge>
      </AutoColumn>
      <FaucetsContainer>

      </FaucetsContainer>
      {FakeTokens.map((token, i) => {
        return (
          <Faucet
          token={token}
          />
        )
      })
      }
    </PageWrapper>
  )
}

const Faucet = ({ token }: { token: Token}) => {
  const { account } = useWeb3React()
  const onClick = useFaucetCallback(token, account);
  return (
    <AutoColumn>
      <MaxButton width="100px" onClick={onClick}>
        Faucet {token.symbol}
      </MaxButton>
    </AutoColumn>
  )
}