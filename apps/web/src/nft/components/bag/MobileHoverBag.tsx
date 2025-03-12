import { useBag } from 'nft/hooks'
import { useBagTotalEthPrice, useBagTotalUsdPrice } from 'nft/hooks/useBagTotalEthPrice'
import { roundAndPluralize } from 'nft/utils'
import { Flex, Image, Text, View } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export const MobileHoverBag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const toggleBag = useBag((state) => state.toggleBag)
  const totalEthPrice = useBagTotalEthPrice()
  const totalUsdPrice = useBagTotalUsdPrice()
  const { formatEther, formatNumberOrString } = useFormatter()

  const shouldShowBag = itemsInBag.length > 0

  return (
    <Flex
      row
      alignItems="center"
      display="none"
      $md={{
        display: shouldShowBag ? 'flex' : 'none',
      }}
      $platform-web={{
        position: 'fixed',
      }}
      bottom={72}
      left={16}
      right={16}
      backgroundColor="$surface2"
      p="$padding8"
      zIndex={zIndexes.dropdown}
      borderRadius="$rounded8"
      borderColor="$surface3"
      borderWidth={1}
      justifyContent="space-between"
    >
      <Flex row gap="$spacing8">
        <View width={34} height={34}>
          {itemsInBag.slice(0, 3).map((item, index) => {
            return (
              <Image
                key={index}
                position="absolute"
                src={item.asset.smallImageUrl}
                top="50%"
                left="50%"
                width={26}
                height={26}
                borderRadius="$rounded8"
                overflow="hidden"
                style={{
                  transform:
                    index === 0
                      ? 'translate(-50%, -50%) rotate(-4.42deg)'
                      : index === 1
                        ? 'translate(-50%, -50%) rotate(-14.01deg)'
                        : 'translate(-50%, -50%) rotate(10.24deg)',
                  zIndex: index,
                }}
              />
            )
          })}
        </View>
        <Flex>
          <Text variant="body2">{roundAndPluralize(itemsInBag.length, 'NFT')}</Text>
          <Flex row gap="$gap8">
            <Text variant="body2">
              {`${formatEther({ input: totalEthPrice.toString(), type: NumberType.NFTToken })}`} ETH
            </Text>
            <Text variant="body4" color="$neutral2">
              {formatNumberOrString({ input: totalUsdPrice, type: NumberType.FiatNFTToken })}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Text
        variant="buttonLabel3"
        color="$white"
        backgroundColor="$accent1"
        py="$spacing8"
        px="$spacing18"
        borderRadius="$rounded12"
        cursor="pointer"
        onPress={toggleBag}
      >
        View bag
      </Text>
    </Flex>
  )
}
