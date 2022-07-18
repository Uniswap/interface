import CreateProposal from 'pages/CreateProposal'
import { Route } from 'react-router-dom'

import Landing from './Landing'
import VotePage from './VotePage'

export default function Vote() {
  return (
    <>
      <Route exact strict path="/vote/:governorIndex/:id">
        <VotePage />
      </Route>
      <Route exact strict path="/vote/create-proposal">
        <CreateProposal />
      </Route>
      <Route exact strict path="/vote">
        <Landing />
      </Route>
    </>
  )
}
