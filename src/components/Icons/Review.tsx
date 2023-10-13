import { Edit } from 'react-feather'
import styled from 'styled-components'

const ReviewIconContainer = styled.div`
  background-color: #fc72ff;
  border-radius: 100px;
  width: 24px;
  height: 24px;
  text-align: center;
`
export const Review = () => {
  return (
    <ReviewIconContainer>
      <Edit size="12px" strokeWidth="2px" />
    </ReviewIconContainer>
  )
}
