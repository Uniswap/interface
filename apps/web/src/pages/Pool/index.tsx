import Positions from 'pages/Pool/Positions'
import TopPools from 'pages/Pool/TopPools'
import { Navigate } from 'react-router-dom'
import { Flex } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'

export default function Pool() {
  const { value: v4Enabled, isLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Everywhere)

  if (!isLoading && !v4Enabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoading) {
    return null
  }

  return (
    <Flex row maxWidth="$xxl" width="100%" gap={60} mt="$spacing48" mx="$spacing40">
      <Flex grow>
        <Positions />
      </Flex>
      <Flex width={360}>
        <TopPools />
      </Flex>
    </Flex>
  )
}
