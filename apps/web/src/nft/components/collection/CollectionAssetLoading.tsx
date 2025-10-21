import SizingImage from 'assets/images/sizingImage.png'
import { Flex, Image, Shine } from 'ui/src'

const ASSET_PAGE_SIZE = 25

const CollectionAssetLoading = ({ height }: { height?: number }) => {
  return (
    <Flex borderRadius="$rounded12" pb="$padding12" backgroundColor="$surface2">
      <Flex width="100%" height={height ?? 200}>
        <Flex height="100%" width="100%" />
        <Image width="100%" opacity={0} src={SizingImage} />
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between" mt="$spacing12" pl="$spacing12" pr="$spacing12">
        <Shine>
          <Flex height={12} width={120} />
        </Shine>
      </Flex>
      <Flex row alignItems="center" justifyContent="space-between" mt="$spacing12" pl="$spacing12" pr="$spacing12">
        <Shine>
          <Flex height={16} width={80} />
        </Shine>
      </Flex>
    </Flex>
  )
}

export const LoadingAssets = ({ count, height }: { count?: number; height?: number }) => (
  <>
    {Array.from(Array(count ?? ASSET_PAGE_SIZE), (_, index) => (
      <CollectionAssetLoading key={index} height={height} />
    ))}
  </>
)
