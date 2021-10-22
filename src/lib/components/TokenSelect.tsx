interface Token {
  address: string
  symbol: string
  logoUri?: string
}

interface TokenSelectProps {
  value?: Token
  onChange: (token: Token) => void
}

export default function TokenSelect({}: TokenSelectProps) {
  return null
}
