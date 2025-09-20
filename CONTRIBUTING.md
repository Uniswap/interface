# Contributing to JuiceSwap

## Development Workflow

### Branch Protection and Workflow Rules

**IMPORTANT**: Direct commits to `develop` and `main` branches are strictly prohibited.

### Required Workflow

1. **Always create a feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** on the feature branch
3. **Commit your changes** with clear commit messages
4. **Push the feature branch** to GitHub:
   ```bash
   git push -u origin feature/your-feature-name
   ```

5. **Create a Pull Request** targeting `develop` branch
6. **Wait for review and approval** before merging
7. **Never merge your own PRs** without proper review

### Branch Naming Convention

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without feature changes

Examples:
- `feature/citrea-swap-integration`
- `fix/trading-api-response-format`
- `docs/update-readme`

### Commit Message Guidelines

Use clear, descriptive commit messages:

```
type: Brief description of changes

Detailed explanation if needed
- List specific changes
- Reference issues if applicable
```

Types:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

### Code Quality Requirements

Before creating a PR, ensure:

1. **Linting passes**: `yarn lint`
2. **Type checking passes**: `yarn typecheck`
3. **Tests pass**: `yarn test`
4. **Build succeeds**: `yarn build`

### Pull Request Process

1. **Fill out the PR template** completely
2. **Include test plan** with specific steps to verify changes
3. **Request appropriate reviewers**
4. **Respond to feedback** promptly
5. **Keep PRs focused** - one feature/fix per PR
6. **Update documentation** if your changes affect user-facing functionality

### Emergency Procedures

For critical production issues:

1. Create a `hotfix/` branch from `main`
2. Fix the issue with minimal changes
3. Create PR to `main` with urgent review request
4. After merge, ensure fix is also applied to `develop`

### Branch Protection Settings

The following branches have protection rules:

- **`main`**: Production branch
  - Requires PR review
  - No direct pushes allowed
  - Requires status checks to pass

- **`develop`**: Development branch
  - Requires PR review
  - No direct pushes allowed
  - Requires status checks to pass

### Violation Consequences

Violations of these workflow rules may result in:

1. **First violation**: Warning and education
2. **Repeated violations**: Temporary loss of direct push access
3. **Severe violations**: Repository access review

### Getting Help

If you're unsure about the workflow:

1. Ask in the team chat before making changes
2. Review existing PRs for examples
3. Consult with senior team members
4. Read the project documentation thoroughly

## Development Environment Setup

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- Yarn package manager
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/JuiceSwapxyz/bapp.git
cd bapp

# Install dependencies
yarn install

# Run initial checks
yarn local:check

# Start development server
yarn web dev
```

### Available Commands

- `yarn web dev` - Start web development server
- `yarn mobile ios` - Start iOS development
- `yarn mobile android` - Start Android development
- `yarn test` - Run all tests
- `yarn lint` - Run linting
- `yarn typecheck` - Run type checking
- `yarn build` - Build for production

### Testing

Always test your changes:

1. **Unit tests**: `yarn test`
2. **Integration tests**: Verify in development environment
3. **Manual testing**: Test user-facing functionality
4. **Cross-platform testing**: Test on multiple devices/browsers

### Reporting Bugs

Open a GitHub Issue and include:

- Which app is affected (web, mobile, or extension)
- Platform (iOS, Android, browser version, etc.)
- App version (Production or dev)
- Steps to reproduce, screenshots, logs, etc.

### Suggesting Features or Improvements

Start a Discussion to propose ideas, gather feedback, or brainstorm improvements.

## Questions?

If you have questions about contributing, please:

1. Check existing documentation
2. Search closed issues and PRs
3. Ask in team communication channels
4. Create a discussion thread for broader questions

Thank you for contributing to JuiceSwap!
