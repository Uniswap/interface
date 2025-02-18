import { PropsWithChildren } from 'react'
import { Flex, Image, ImageProps, useIsDarkMode, useWindowDimensions } from 'ui/src'
import {
  UNITAGS_ADRIAN_DARK,
  UNITAGS_ADRIAN_LIGHT,
  UNITAGS_ANDREW_DARK,
  UNITAGS_ANDREW_LIGHT,
  UNITAGS_BRYAN_DARK,
  UNITAGS_BRYAN_LIGHT,
  UNITAGS_CALLIL_DARK,
  UNITAGS_CALLIL_LIGHT,
  UNITAGS_FRED_DARK,
  UNITAGS_FRED_LIGHT,
  UNITAGS_MAGGIE_DARK,
  UNITAGS_MAGGIE_LIGHT,
  UNITAGS_PHIL_DARK,
  UNITAGS_PHIL_LIGHT,
  UNITAGS_SPENCER_DARK,
  UNITAGS_SPENCER_LIGHT,
} from 'ui/src/assets'
import { zIndexes } from 'ui/src/theme'

// Makes it easier to change later if needed
const MODIFIER = 1

// TODO WALL-5162 replace this static background with one using unitag components and interactable
export function UnitagClaimBackground({ children, blurAll }: PropsWithChildren<{ blurAll: boolean }>): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const { height, width } = useWindowDimensions()

  const heightFactor = height * MODIFIER
  const widthFactor = width * MODIFIER

  const blurAllValue = 'blur(10px)'

  const imageProps: ImageProps = {
    position: 'absolute',
    objectFit: 'contain',
    resizeMode: 'contain',
    filter: blurAll ? blurAllValue : undefined,
  }

  return (
    <Flex height="100%" width="100%">
      <Flex centered height="100%" width="100%" zIndex={zIndexes.default}>
        {children}
      </Flex>

      <Flex position="absolute" height="100%" width="100%" zIndex={zIndexes.background}>
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_MAGGIE_DARK : UNITAGS_MAGGIE_LIGHT}
          height={0.188 * heightFactor}
          width={0.253 * widthFactor}
          top={-0.045 * heightFactor}
          left={-0.015 * widthFactor}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_SPENCER_DARK : UNITAGS_SPENCER_LIGHT}
          height={0.166 * heightFactor}
          width={0.239 * widthFactor}
          top={0.057 * heightFactor}
          ml="auto"
          mr="auto"
          right={0}
          left={0}
          transform={`translate(${0.005 * widthFactor}px, 0px)`}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_ADRIAN_DARK : UNITAGS_ADRIAN_LIGHT}
          height={0.203 * heightFactor}
          width={0.248 * widthFactor}
          top={-0.05 * heightFactor}
          right={-0.072 * widthFactor}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_ANDREW_DARK : UNITAGS_ANDREW_LIGHT}
          height={0.214 * heightFactor}
          width={0.26 * widthFactor}
          top={0}
          bottom={0}
          mt="auto"
          mb="auto"
          left={-0.15 * widthFactor}
          filter={blurAll ? blurAllValue : 'blur(2px)'}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_CALLIL_DARK : UNITAGS_CALLIL_LIGHT}
          height={0.189 * heightFactor}
          width={0.206 * widthFactor}
          bottom={0.05 * heightFactor}
          left={-0.01 * widthFactor}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_PHIL_DARK : UNITAGS_PHIL_LIGHT}
          height={0.19 * heightFactor}
          width={0.266 * widthFactor}
          bottom={-0.08 * heightFactor}
          ml="auto"
          mr="auto"
          right={0}
          left={0}
          transform={`translate(${-0.015 * widthFactor}px, 0px)`}
          filter={blurAll ? blurAllValue : 'blur(2px)'}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_FRED_DARK : UNITAGS_FRED_LIGHT}
          height={0.206 * heightFactor}
          width={0.209 * widthFactor}
          bottom={0.044 * heightFactor}
          right={-0.009 * widthFactor}
        />
        <Image
          {...imageProps}
          src={isDarkMode ? UNITAGS_BRYAN_DARK : UNITAGS_BRYAN_LIGHT}
          height={0.206 * heightFactor}
          width={0.209 * widthFactor}
          top={0}
          bottom={0}
          mt="auto"
          mb="auto"
          right={-0.085 * widthFactor}
          transform={`translate(0px, ${0.012 * heightFactor}px)`}
          filter={blurAll ? blurAllValue : 'blur(4px)'}
        />
      </Flex>
    </Flex>
  )
}
