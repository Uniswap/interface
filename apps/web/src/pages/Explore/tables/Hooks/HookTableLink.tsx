import { styled } from '@universe/mycelium/styled'
import { Link } from 'react-router'

export const HookTableLink = styled(Link, {
  platform: 'web',
  base: 'flex min-w-0 cursor-pointer items-center gap-3 self-stretch rounded-4 text-neutral1 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent1 focus-visible:-outline-offset-2',
})
