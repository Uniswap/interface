import themed, { TYPE } from '../../../themed'

interface LabelProps {
  name: string
}

const Wrapper = themed.div`
  padding-top: 4px;
  user-select: none;
`

export default function Label({ name }: LabelProps) {
  return (
    <Wrapper>
      <TYPE.label>{name}</TYPE.label>
    </Wrapper>
  )
}
