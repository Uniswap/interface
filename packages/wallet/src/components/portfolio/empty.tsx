import { borderRadii } from '@universe/mycelium'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from '@universe/mycelium/assets'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import React from 'react'
import { ImageBackground, ImageSourcePropType } from 'react-native'

export function usePortfolioEmptyStateBackground(): React.FC<{ children: React.ReactNode }> {
  const isDarkMode = useIsDarkMode()
  return ({ children }: { children: React.ReactNode }): JSX.Element => {
    return (
      <BackgroundImage image={isDarkMode ? CRYPTO_PURCHASE_BACKGROUND_DARK : CRYPTO_PURCHASE_BACKGROUND_LIGHT}>
        {children}
      </BackgroundImage>
    )
  }
}

const BackgroundImage = ({
  children,
  image,
}: {
  children: React.ReactNode
  image: ImageSourcePropType
}): JSX.Element => {
  return (
    <ImageBackground borderRadius={borderRadii.rounded24} source={image}>
      {children}
    </ImageBackground>
  )
}
