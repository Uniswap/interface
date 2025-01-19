import { LoadingBubble } from 'components/Tokens/loading'
import useEFPStats from 'hooks/useEFPStats'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'ui/src'

export default function Stats({ account }: { account: string }) {
  const { stats, isLoading, getStatLink } = useEFPStats(account)

  return (
    <Flex row gap="$spacing6">
      <Link style={{ textDecoration: 'none' }} to={getStatLink('following')} target="_blank">
        <Flex row gap="$spacing6" alignItems="center" hoverStyle={{ opacity: 0.7 }}>
          <Text variant="body4" color="neutral2">
            Following
          </Text>
          {isLoading ? (
            <LoadingBubble width="22px" height="12px" />
          ) : (
            <Text variant="body4">{stats?.following_count ?? '-'}</Text>
          )}
        </Flex>
      </Link>
      <Link style={{ textDecoration: 'none' }} to={getStatLink('followers')} target="_blank">
        <Flex row gap="$spacing6" alignItems="center" hoverStyle={{ opacity: 0.7 }}>
          <Text variant="body4" color="neutral2">
            Followers
          </Text>
          {isLoading ? (
            <LoadingBubble width="22px" height="12px" />
          ) : (
            <Text variant="body4">{stats?.followers_count ?? '-'}</Text>
          )}
        </Flex>
      </Link>
    </Flex>
  )
}
