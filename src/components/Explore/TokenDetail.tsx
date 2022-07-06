import { useToken } from 'hooks/Tokens'

export default function TokenDetail({ address }: { address: string }) {
  const token = useToken(address)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol
  if (!token) {
    return <div>no token</div>
  }

  return (
    <div>
      Token Detail Page for token: {address}| {tokenName} | {tokenSymbol}
    </div>
  )
}
