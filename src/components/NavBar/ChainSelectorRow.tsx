import { useWeb3React } from '@web3-react/core'
import Loader from 'components/Loader'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { CheckMarkIcon } from 'nft/components/icons'
import styled, { useTheme } from 'styled-components/macro'

const Container = styled.button`
  display: grid;
  background: none;
  grid-template-columns: 1fr 4fr 1fr;
  align-items: center;
  text-align: left;
  line-height: 24px;
  border: none;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 12px;
  color: white;
  width: 240px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
  }
`

const Label = styled.div`
  grid-column: 2;
  grid-row: 1;
  flex-grow: 1;
  font-size: 16px;
`

const Status = styled.div`
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  width: fit-content;
`

const ApproveText = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  grid-column: 2;
  grid-row: 2;
`

const Logo = styled.img`
  height: 20px;
  width: 20px;
`

export default function ChainSelectorRow({
  targetChain,
  onSelectChain,
  isPending,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
  isPending: boolean
}) {
  const { chainId } = useWeb3React()
  const active = chainId === targetChain
  const { label, logoUrl } = getChainInfo(targetChain)

  const theme = useTheme()

  return (
    <Container onClick={() => onSelectChain(targetChain)}>
      <Logo src={logoUrl} alt={label} />
      <Label>{label}</Label>
      {isPending && <ApproveText>Approve in wallet</ApproveText>}
      <Status>
        {active && <CheckMarkIcon width={20} height={20} color={theme.accentActive} />}
        {isPending && <Loader />}
      </Status>
    </Container>
  )
}
