import { Flex, View } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import QueryTokenLogo from '~/components/Logo/QueryTokenLogo'
import { EllipsisText, TableText } from '~/components/Table/styled'
import { TokenStat } from '~/state/explore/types'

export function TokenDescription({ token }: { token: TokenStat }) {
  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <View pr="$spacing4">
        <QueryTokenLogo token={token} size={24} />
      </View>
      <EllipsisText data-testid={TestID.TokenName}>{token.name ?? token.project?.name}</EllipsisText>
      <TableText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {token.symbol}
      </TableText>
    </Flex>
  )
}
