import { Token } from "@uniswap/sdk-core"
import { useWeb3React } from "@web3-react/core"
import { AutoColumn } from "components/Column"
import { SupportedChainId } from "constants/chains"
import { FakeTokensMapMumbai, FakeTokensMapSepolia, FakeTokens_MUMBAI, FakeTokens_SEPOLIA } from "constants/fake-tokens"
import { useFaucetCallback } from "hooks/useApproveCallback"
import { MaxButton } from "pages/Pool/styleds"
import { SmallMaxButton } from "pages/RemoveLiquidity/styled"
import { useCallback, useEffect, useState } from "react"
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
  grid-gap: 20px;
  margin-top: 16px;
`

export default function FaucetsPage() {
  const {account, provider, chainId } = useWeb3React()

  const [isHolder, setHolder] = useState<boolean>()

  const FakeTokens = chainId === SupportedChainId.SEPOLIA ? FakeTokens_SEPOLIA : FakeTokens_MUMBAI


  useEffect(() => {
    const getBeacon = async () => {
      if (account && provider && chainId === SupportedChainId.SEPOLIA) {
        try {
          let result = await fetch(`https://beacon.degenscore.com/v1/beacon/${account.toLowerCase()}`)
        setHolder(result.status === 200)
        } catch (err) {
          console.log(err)
        }
      }
    }
    getBeacon()
  }, [account, provider, chainId])

  return (
    <PageWrapper>
      <AutoColumn>
        <ThemedText.HeadlineLarge>Faucet</ThemedText.HeadlineLarge>
      </AutoColumn>
      <FaucetsContainer>
      {account && provider && isHolder && (chainId === SupportedChainId.SEPOLIA) && FakeTokens.map((token, i) => {
        return (
          <Faucet
          token={token}
          />
        )
      })}
      {(!account || !provider) ?
      <ThemedText.DeprecatedLargeHeader>
        Connect Account
      </ThemedText.DeprecatedLargeHeader> : chainId !== SupportedChainId.SEPOLIA ? 
      <ThemedText.DeprecatedLargeHeader>
        Connect to Sepolia
      </ThemedText.DeprecatedLargeHeader> : isHolder === false ? 
      <ThemedText.DeprecatedLargeHeader>
        Must be Beacon Owner...
      </ThemedText.DeprecatedLargeHeader> 
      : null}
      </FaucetsContainer>
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