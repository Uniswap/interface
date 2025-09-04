import React from 'react'
import { ImageBackground, ImageSourcePropType } from 'react-native'
import { useIsDarkMode } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { borderRadii } from 'ui/src/theme'

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
