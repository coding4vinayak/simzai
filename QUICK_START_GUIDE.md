# SimpleCRM - Quick Development Guide

## For New Team Members

This is a quick reference guide to get you started with developing on the SimpleCRM project using our component-based branch structure.

## Branch Overview

### Component Assignment
- **Security**: `security-enhancements`, `security-fixes` branches
- **DevOps**: `backup-redundancy`, `database-improvements` branches
- **Backend**: `api-enhancements`, `security-fixes` branches
- **Frontend**: `frontend-components` branch
- **Documentation**: `documentation-updates` branch

## Getting Started

### 1. Checkout Your Component Branch
```bash
git checkout <your-component-branch>
```

### 2. Create Your Feature Branch
```bash
git checkout -b feature/<your-feature-name>
```

### 3. Make Your Changes
- Focus on your component area
- Write clean, well-documented code
- Follow team's coding standards
- Add tests for new functionality

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat(component): description of your changes"
```

### 5. Push and Create PR
```bash
git push origin feature/<your-feature-name>
```
Then create a Pull Request on GitHub from your feature branch to the component branch.

## Quick Rules

### ✅ DO
- Work only in your assigned component area
- Keep PRs small and focused
- Write meaningful commit messages
- Test your changes before submitting
- Follow your team's coding standards
- Update documentation if needed

### ❌ DON'T
- Make changes outside your component area
- Submit huge PRs with many changes
- Commit directly to main branches
- Ignore security considerations
- Skip writing tests
- Forget to document breaking changes

## Common Commands

```bash
# Sync with remote regularly
git fetch
git pull origin <your-component-branch>

# Create feature branch
git checkout <component-branch>
git checkout -b feature/<feature-name>

# Push feature branch
git push origin feature/<feature-name>

# Rebase if needed
git fetch
git rebase origin/<component-branch>
```

## Need Help?

- Ask your component team leader
- Check the detailed guidelines in DEVELOPMENT_RULES.md
- Discuss in team channels
- Look at existing PRs for examples

## Important Links

- GitHub Repository: [https://github.com/coding4vinayak/simzai](https://github.com/coding4vinayak/simzai)
- Branch Organization: BRANCH_ORGANIZATION.md
- Development Rules: DEVELOPMENT_RULES.md
- Issue Tracker: GitHub Issues

## Branch Purpose Reminders

- `main`: Production code - No direct commits
- `security-fixes`: Current security work - Core team
- `security-enhancements`: Security improvements - Security team
- `backup-redundancy`: Backup systems - DevOps team  
- `database-improvements`: Database work - DevOps team
- `api-enhancements`: API work - Backend team
- `frontend-components`: UI/UX - Frontend team
- `documentation-updates`: Docs - Documentation team

## Quick Reference for PR Creation

1. Branch from: Your component branch
2. Target: Your component branch (NOT main)
3. Title: `[Component] Brief description`
4. Description: Include what and why
5. Assign: Component owner for review

Happy coding! 🚀