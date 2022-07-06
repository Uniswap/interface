import TokenDetail from 'components/Explore/TokenDetail'
import { RouteComponentProps } from 'react-router-dom'
export function TokenDetails({
  match: {
    params: { tokenAddress },
  },
}: RouteComponentProps<{ tokenAddress: string }>) {
  return <TokenDetail tokenAddress={tokenAddress} />
}
