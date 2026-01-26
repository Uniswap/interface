import { Flex } from 'ui/src'
import { ReactComponent as HskswapIcon } from 'ui/src/assets/icons/hskswap-icon.svg'
import { ReactComponent as HskswapText } from 'ui/src/assets/icons/hskswap-text.svg'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function CompanyMenu() {
  return (
    <Flex row alignItems="center" justifyContent="center" gap="$gap4" $platform-web={{ containerType: 'normal' }}>
      {/* <Link to="/?intro=true" style={{ textDecoration: 'none' }}> */}
      <Flex row alignItems="center" gap="$gap4" data-testid={TestID.NavUniswapLogo}>
        <HskswapIcon width={32} height={36} />
        <Flex ml="7px">
          <HskswapText width={122} height={16} />
        </Flex>
      </Flex>
      {/* </Link> */}
    </Flex>
  )
}
