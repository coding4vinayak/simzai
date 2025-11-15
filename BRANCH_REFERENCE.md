# SimpleCRM Branch Reference Guide

## Current Branch Structure

### Component-Based Branches:
1. `security-enhancements` - Security features and improvements
2. `backup-redundancy` - Backup systems and redundancy tools
3. `database-improvements` - Database schema and optimization
4. `api-enhancements` - API improvements and endpoints
5. `frontend-components` - Frontend components and UI
6. `documentation-updates` - Documentation and guides
7. `security-fixes` - Current security fixes branch (main work)
8. `main` - Production branch

## Quick Commands:

### To work on a specific component:
- `git checkout <branch-name>`
- Make your changes
- Commit and push: `git push origin <branch-name>`

### To create a feature branch:
- `git checkout <component-branch>`
- `git checkout -b feature/<feature-name>`
- Make changes, commit, and push
- Create PR to component branch

### To sync with remote:
- `git fetch`
- `git pull origin <branch-name>`

## Current Status:
- `security-fixes` branch contains all security and redundancy features
- All branches are up-to-date with latest changes
- Ready for team-based development approach