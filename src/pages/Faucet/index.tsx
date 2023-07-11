import { Token } from "@uniswap/sdk-core"
import { useWeb3React } from "@web3-react/core"
import { AutoColumn } from "components/Column"
import { SupportedChainId } from "constants/chains"
import { FakeTokens_MUMBAI, FakeTokens_SEPOLIA } from "constants/fake-tokens"
import { useFaucetCallback } from "hooks/useApproveCallback"
import { MaxButton } from "pages/Pool/styleds"
import { useEffect, useState } from "react"
import styled from "styled-components/macro"
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

const GenesisAddressses = ['0x515c07dd7cd01496d4000e4998b4fd5acd2c09e1',
  '0x65f106ec944aF77914d6DF5EaC6488a147a5d054',
  '0xaEe294951f2B69b8C7720Eed7FF05DbB4B184a86',
  '0x565d380416a2889b817c6eb493f6deef029212aa',
  '0xc56bc1a93909508b0f6e57a32a5c2cc8b4940c08',
  '0x68f3f77ee50da27966f29fd55a7fd0ac79008ca7',
  '0x6c3C002d8d56A886995d0817C582db34C43B6838',
  '0xd24a9A9f594b038A6cFb91370BC8014D28201009',
  '0x77F1812f662F4b006a47173138fA8d63988E07C2',
  '0x81e0d167c507D0fA487B6c8E2a625C4c7F69355C',
  '0x4dD37c7c4a687E7378D5621e30802f7444d10203',
  '0xd309efbd1410d595Aeb610dDE0eb7A2E087B42Bc',
  '0xFE49F9193ef934f403455016A191e208dc2374E8',
  '0x4C83B45346cA7B7e88446cA7A856CFFD91fB7f5e',
  '0x97891BaD4d43DF73b658D6E16918D0D3dAD0cB5d',
  '0x8b5A8a28CbB06fe60E0Caa727efE03d796197c75',
  '0x1eef8295a36be966d845a040c610c502d41cc78b',
  '0xE9Fe5801b049494BedE09F2800CfE3bE09C81D9b',
  '0x37D34B424dC624a41fE412ab1460d1e0eBEfb8aF',
  '0x8b5A8a28CbB06fe60E0Caa727efE03d796197c75',
  '0x0C5567DDB9eEA6A66365D55Bc5302567B288b978',
  '0xe49D0d8CF01Ea366D804CC84738A768F0b8b175e',
  '0x48b576c87e788a762D6f95A456f2A39113b46950',
  '0xEead444F622Cb4F19Bb33c7D4DeF50FD99936A05',
  '0x4a875FcBc55cA3c85E572B94aFf88c316477c002']

export default function FaucetsPage() {
  const {account, provider, chainId } = useWeb3React()

  const [isHolder, setHolder] = useState<boolean>()

  const FakeTokens = chainId === SupportedChainId.SEPOLIA ? FakeTokens_SEPOLIA : FakeTokens_MUMBAI


  useEffect(() => {
    const getBeacon = async () => {
      if (account && provider && chainId === SupportedChainId.SEPOLIA) {
        try {
          const result = await fetch(`https://beacon.degenscore.com/v1/beacon/${account.toLowerCase()}`)
        setHolder(result.status === 200)
        } catch (err) {
          console.log(err)
        }
      }
    }
    if (account) {
      if (GenesisAddressses.find((val) => val.toLowerCase() === account.toLowerCase())) {
        setHolder(true)
      } else {
        getBeacon()
      }
    }
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
          key={i}
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