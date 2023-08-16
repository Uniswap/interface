export default async function getAddress(address: string, url: string) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/address/' + address
  const formattedAsset = {
    title: 'View ' + address.slice(0, 6) + ' on Uniswap',
    image,
    url,
  }
  return formattedAsset
}
