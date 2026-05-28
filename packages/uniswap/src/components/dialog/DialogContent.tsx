import type { ReactNode } from 'react'
import { Flex, type FlexProps, Text, type TextProps } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'

export interface DialogContentProps {
  icon: ReactNode
  title: string | ReactNode
  titleColor?: TextProps['color']
  subtext: string | ReactNode
  learnMoreUrl?: string
  learnMoreTextColor?: TextProps['color']
  learnMoreTextVariant?: TextProps['variant']
  textAlign: 'center' | 'left'
  iconBackgroundColor?: FlexProps['backgroundColor']
  children?: ReactNode
  footer?: ReactNode
}

export function DialogContent({
  icon,
  title,
  titleColor,
  subtext,
  learnMoreUrl,
  learnMoreTextColor,
  learnMoreTextVariant,
  textAlign,
  iconBackgroundColor,
  children,
  footer,
}: DialogContentProps): JSX.Element {
  return (
    <Flex
      flexDirection="column"
      alignItems={textAlign === 'center' ? 'center' : 'flex-start'}
      gap="$spacing16"
      py="$padding8"
    >
      <Flex
        backgroundColor={iconBackgroundColor ?? '$surface2'}
        borderRadius="$rounded12"
        height="$spacing48"
        width="$spacing48"
        alignItems="center"
        justifyContent="center"
        data-testid="dialog-icon"
      >
        {icon}
      </Flex>
      <Flex gap="$spacing8" alignItems={textAlign === 'center' ? 'center' : 'flex-start'}>
        <Text variant="subheading1" color={titleColor ?? '$neutral1'}>
          {title}
        </Text>
        {typeof subtext === 'string' ? (
          <Text variant="body3" color="$neutral2" textAlign={textAlign}>
            {subtext}
          </Text>
        ) : (
          subtext
        )}
        {learnMoreUrl && (
          <LearnMoreLink url={learnMoreUrl} textColor={learnMoreTextColor} textVariant={learnMoreTextVariant} />
        )}
      </Flex>
      {children && (
        <Flex
          width="100%"
          borderRadius="$rounded12"
          backgroundColor="$surface2"
          borderWidth="$spacing1"
          borderColor="$surface3"
          px="$spacing16"
          py="$spacing12"
        >
          {children}
        </Flex>
      )}
      {footer}
    </Flex>
  )
}
