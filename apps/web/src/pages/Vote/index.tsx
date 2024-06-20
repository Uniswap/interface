import CreateProposal from 'pages/CreateProposal'
import Landing from 'pages/Vote/Landing'
import VotePage from 'pages/Vote/VotePage'
import { Route, Routes } from 'react-router-dom'

export default function Vote() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path=":governorIndex/:id" element={<VotePage />} />
      <Route path="create-proposal" element={<CreateProposal />} />
    </Routes>
  )
}
