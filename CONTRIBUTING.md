# Contribution Guidelines

A Contribution Guideline shall facilitate the foundation for a collaborative ground for every contributor working on Swapr codebase(s).

## Project Management Software 
We use [ZenHub](https://zenhub.com), an agile project management which is tightly integrated with GitHub. Contact one of the core contributors to invite you to the ZenHub board.

## Tickets

- Every task needs have an estimated ticket
- If you see something during work which is out of scope of the ticket:
  1. make a new ticket or reopen a ticket if exists.
  2. finish the current ticket first.
  3. If not depending on the other ticket, make a new branch from the **dev** branch, not the branch you are working on.
  4. No ticket is needed, but a branch, if you can do it under one hour. If you see that it takes longer, make a ticket with estimate.
  5. You can restimate your tickets if you see its much more work. But do not use it to track hours. It's NOT time tracking.

## Git Branches

- One ticket, one branch. 
- If the ticket involes subtasks 
  - Create a parent ticket
  - Branch out from parent ticket and merge from subtickets
  - Merge parent ticket to `develop` 
- Use /feature/, /bug/, or /chore/ (chore to fix typo and little stuff)
- Avoid working on the `main` branch unless absolutely necessary. Branch names should be named after what they do.
- sub-branch like "Feature/stufspecial/otherstuff" should not happen. You can work for yourself in this structur, but please don't get others to work in your sub-branch (It's a sign that something is off. We add to much complexity to non complex stuff. The interface software is still a simple interface)

Some more toughts on branches see [Phil Hord's answer on Stack Overflow](https://stackoverflow.com/a/6065944/2151050).

## Pull Requests (PR)

- PRs should target `develop` branch,
- A subtask PR should target parent branch.
- Draft PRs should be used when a PR is Work In Progress (WIP). 
- If you make a PR from `feature/stufspecial/otherstuff` to `feature/stufspecial/` you should pull it yourself.
- After a PR is merged, the branch can be deleted after two weeks.
 
## Project Structure

At Swapr, we are using React to build the frontend. 

### General Components

A General Component is a React Component that is primitive. A General Component should come with bare minimum styles and configurations. It, however, can be extended as per view/page requirements.

1. Directory: `src/components`
2. Component: `src/components/<ComponentName>/index.tsx`
3. Unit tests: `src/components/<ComponentName>/index.spec.tsx`
4. styled-components functions must be stored in the same file

### Pages

A Page is a single page

- Directory `src/pages/<PageName>/components`

## React Hooks

- Directory `src/hooks`
- Layout `src/hooks/use<HookName>.tsx`
- Unit Tests `src/hooks/use<HookName>.spec.tsx`

### Assets

- Directory `src/assets`
- SVG in `src/assets/svg`

### App State (Redux)

- Directory `src/state/<stateDomain>`
- State domain directory `src/state/<stateDomain>`
  - `actions.ts`
  - `hooks.ts`
  - `reducer.ts`
  - `selectors.ts`
  - `updator.ts`

## Styles

- Directory `src/styles`
- Theme in `src/styles/themes.ts`
- Global Style (from styled-components) in `src/Global.tsx`
- Google fonts in `src/styles.fonts.css`

## Interfaces

TypeScript interfaces that are used in more than one place should be stored here.

# Coding Standards

At DXdao, everyone thrives to write high-quality code. And such as every Contributor should follow _best practices_ to achieve their goals.

## Code Indentation

Use two space to intend code. Lint code using Prettier. Configurations are stored in `.prettierrc` IDE of choice should be able to format file upon saving file.

## No Default Export

Except for external modules, all internal files must avoid default exports in ES6.

**Good**

```jsx
// GoodExport.ts
export function GoodExport() {
  return 'I am exported using export'
}

// index.ts
import { GoodExport } from './GoodExport.ts'
```

**Bad**

```jsx
// NoSoGoodExport.ts
export function NoSoGoodExport() {
  return 'I am exported using export'
}

// index.ts
import VeryGoodExport from './NoSoGoodExport.ts'
```

As you can see, with the second example, the imported name can be dynamic. Please avoid this.

## Group Imports

**Good**

```jsx
// Externals
import React from 'react'

// Components
import { Container } from 'src/components/Container'
import { CardBody } from 'src/components/CardBody'
import { Card } from 'src/components/Card'

// Layouts
import { Center } from 'src/layouts/Center'

export function IndexView() {
  return (
    <Center minHeight="100%">
      <Container>
        <Card>
          <CardBody>Hello world</CardBody>
        </Card>
      </Container>
    </Center>
  )
}
```

## Naming Convention

### React Components

- Use `TitleCase` for Components
- Use `

### Functions/Variables

Use `camelCase` for variables and functions

### Constants

Use `CAPITAL_CASE` for constants.

# Tests

The code base uses [Jest](https://jestjs.io/) and [Cypress](https://www.cypress.io/) for e2e tests

Each Component/function/file should be accompanied with approriate tests.
