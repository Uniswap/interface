import useGetGrantProgram from 'hooks/campaigns/useGetGrantProgram'

import SingleProgram from './SingleProgram'

const LatestProgram = () => {
  const { data } = useGetGrantProgram('latest')
  return <SingleProgram program={data} />
}

export default LatestProgram
