# Contribution Guidelines

A Contribution Guideline shall facilitate the foundation for a collaborative ground for every contributor working on Swapr codebase(s).

## Project Management Software

We use [ZenHub](https://zenhub.com), an agile project management which is tightly integrated with GitHub. Contact one of the core contributors to invite you to the ZenHub board.

## Tickets

- Every task needs have an estimated ticket
- If you see something during work which is out of scope of the ticket:
  - Make a new ticket or reopen a ticket if exists.
  - Finish the current ticket first.
  - If not depending on the other ticket, make a new branch from the `develop` branch, not the branch you are working on.
  - No ticket is needed, but a branch, if you can do it under one hour. If it takes longer, make a ticket with estimate.
  - You can restimate your tickets if it requires more time and effort. But do not use it to track hours. It's NOT time tracking.

## Git Branches

- One ticket, one branch.
- If the ticket involes subtasks
  - Create a parent ticket
  - Branch out from parent ticket and merge from subtickets
  - Merge parent ticket to `develop`
- Use folders to categorize branches followed by the issue number. For example
  - `feature/<issue-number>-add-x` for features
  - `bug/<issue-number>-bug-in-x` for bug fixes
  - `chore/<issue-number>-add-x-to-y` fix typo and little stuff
- Avoid working on the `main` (`master`) branch unless absolutely necessary. Branch names should be named after what they do.
- Sub-branchs like `feature/100-feature-x/other-stuff" should not happen. You can work for yourself in this structur, but please don't get others to work in your sub-branch (It's a sign that something is off. We add to much complexity to non complex stuff. The interface software is still a simple interface)

Some more toughts on branches see [Phil Hord's answer on Stack Overflow](https://stackoverflow.com/a/6065944/2151050).

## Pull Requests (PR)

- PRs should target `develop` branch,
- A subtask PR should target parent branch.
- Draft PRs should be used when a PR is Work In Progress (WIP).
- If you make a PR from `feature/100-feature-x/other-stuff` to `feature/100-feature-x/` you should pull it yourself.
- After a PR is merged, the branch should deleted after two weeks.

## Project Structure

Swapr uses React for the frontend.

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

- Directory `src/theme`
- Theme and global style in `src/theme/index.ts`

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
