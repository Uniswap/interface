import { Welcome } from '~/welcome/welcome'
import type { Route } from './+types/home'

// biome-ignore lint/correctness/noEmptyPattern: this will likely be updated. this is ootb from the create react router app tool.
export function meta({}: Route.MetaArgs) {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }]
}

export default function Home() {
  return <Welcome />
}
