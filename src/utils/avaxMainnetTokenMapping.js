export const getAvaxMainnetTokenLogoURL = (address: string) => {
  let uri

  if (!uri) {
    uri = `https://raw.githubusercontent.com/ava-labs/bridge-tokens/main/avalanche-tokens/${address}/logo.png`
  }

  return uri
}
