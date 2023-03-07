import CreateProposal from 'pages/CreateProposal'
import { Route, Routes } from 'react-router-dom'

import Landing from './Landing'
import VotePage from './VotePage'

export default function Vote() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path=":governorIndex/:id" element={<VotePage />} />
      <Route path="create-proposal" element={<CreateProposal />} />
    </Routes>
  )
}
