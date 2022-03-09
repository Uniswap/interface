import React, { useEffect, useState } from 'react'
import { ImageColorsResult } from 'react-native-image-colors/lib/typescript/types'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex, Inset } from 'src/components/layout'
import { OpenseaNFTAsset } from 'src/features/nfts/types'
import { extractColors } from 'src/utils/colors'

function useNFTColors(asset: OpenseaNFTAsset | undefined) {
  const [loading, setLoading] = useState<boolean>(false)
  const [colors, setColors] = useState<ImageColorsResult | null>(null)

  const theme = useAppTheme()

  useEffect(() => {
    if (!asset?.image_url) return

    setLoading(true)
    extractColors(asset.image_url, theme.colors.primary1).then((result: ImageColorsResult) => {
      setLoading(false)
      setColors(result)
    })
  }, [asset?.image_url, theme.colors.primary1])

  return { loading, colors }
}

export function NFTPalette({ asset }: { asset: OpenseaNFTAsset }) {
  const { colors } = useNFTColors(asset)

  return colors?.platform === 'ios' ? (
    <Flex centered bg="gray50" borderRadius="lg" mt="md" mx="lg" p="sm">
      <Flex centered row>
        <Box style={{ backgroundColor: colors.primary }}>
          <Inset />
        </Box>
        <Box style={{ backgroundColor: colors.secondary }}>
          <Inset />
        </Box>
        <Box style={{ backgroundColor: colors.background }}>
          <Inset />
        </Box>
        <Box style={{ backgroundColor: colors.detail }}>
          <Inset />
        </Box>
      </Flex>
    </Flex>
  ) : null
}
