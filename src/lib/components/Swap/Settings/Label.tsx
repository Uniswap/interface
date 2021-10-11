import themed, { TYPE } from '../../../themed'

interface LabelProps {
  name: string
}

const Wrapper = themed.div`
  user-select: none;
`

export default function Label({ name }: LabelProps) {
  return (
    <Wrapper>
      <TYPE.label>{name}</TYPE.label>
    </Wrapper>
  )
}
