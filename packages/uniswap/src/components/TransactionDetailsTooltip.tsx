import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Anchor,
  Separator as BaseSeparator,
  Flex,
  FlexProps,
  GeneratedIcon,
  IconProps,
  Text,
  UniswapXText,
} from 'ui/src'

type OuterProps = {
  children: ReactNode
  gap?: FlexProps['gap']
}

const Outer = ({ children, gap }: OuterProps): JSX.Element => {
  return (
    <Flex flexDirection="column" gap={gap ?? '$spacing12'} px="$spacing12" width={300}>
      {children}
    </Flex>
  )
}

type Title = {
  title: string
  uniswapX?: boolean
}

const Header = ({
  title,
  Icon,
  iconColor,
  logo,
}: {
  title: Title
  Icon?: GeneratedIcon
  iconColor?: string
  logo?: ReactNode
}): JSX.Element => {
  return (
    <Flex row alignItems="center" gap="$spacing4">
      {logo}
      {Icon && <Icon size="$icon.16" color={iconColor} />}
      {title.uniswapX ? (
        <UniswapXText variant="body3">{title.title}</UniswapXText>
      ) : (
        <Text variant="body3" color="$neutral1">
          {title.title}
        </Text>
      )}
    </Flex>
  )
}

const Content = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <Flex flexDirection="column" gap="$spacing4" position="relative">
      {children}
    </Flex>
  )
}

const Row = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <Flex row justifyContent="space-between" alignItems="center" py="$spacing4">
      {children}
    </Flex>
  )
}

const LineItemLabel = ({ label }: { label: string }): JSX.Element => {
  return (
    <Text variant="body4" color="$neutral2">
      {label}
    </Text>
  )
}

const LineItemValue = ({
  Icon,
  value,
  usdValue,
  iconColor,
  logo,
}: {
  Icon?: GeneratedIcon
  value?: string
  usdValue?: string
  iconColor?: IconProps['color']
  logo?: ReactNode
}): JSX.Element => {
  return (
    <Flex row gap="$spacing4" alignItems="center">
      {logo}
      {Icon && <Icon size="$icon.16" color={iconColor ?? '$neutral2'} />}
      <Text variant="body4" color="$neutral1">
        {value ?? '-'}
      </Text>
      {usdValue && (
        <Text variant="body4" color="$neutral2">
          ({usdValue})
        </Text>
      )}
    </Flex>
  )
}

const Description = ({
  text,
  learnMoreUrl,
}: {
  text: string
  learnMoreUrl?: string
  learnMorePinkColor?: boolean
}): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4">
      <Text variant="body4" color="$neutral2" alignSelf="stretch">
        {text}
      </Text>
      {learnMoreUrl && (
        <Anchor href={learnMoreUrl} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
          <Text variant="buttonLabel4" color={learnMoreUrl ? '$accent1' : '$neutral1'}>
            {t('common.button.learn')}
          </Text>
        </Anchor>
      )}
    </Flex>
  )
}

const Separator = (): JSX.Element => {
  return <BaseSeparator borderColor="$surface3" />
}

export const TransactionDetailsTooltip = {
  Content,
  Description,
  Header,
  LineItemLabel,
  LineItemValue,
  Outer,
  Row,
  Separator,
}
