import { useToken } from 'hooks/Tokens'

export default function TokenDetail({ address }: { address: string }) {
  const token = useToken(address)
  if (!token) {
    return <div>no token</div>
  }
  const tokenName = token.name
  const tokenSymbol = token.symbol

  return (
    <div>
      Token Detail Page for token: {address}| {tokenName} | {tokenSymbol}
    </div>
  )
}
