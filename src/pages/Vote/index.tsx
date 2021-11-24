import CreateProposal from 'pages/CreateProposal'
import { Route } from 'react-router-dom'

import Landing from './Landing'
import VotePage from './VotePage'

export default function Vote() {
  return (
    <>
      <Route exact strict path="/vote/:governorIndex/:id" component={VotePage} />
      <Route exact strict path="/vote/create-proposal" component={CreateProposal} />
      <Route exact strict path="/vote" component={Landing} />
    </>
  )
}
