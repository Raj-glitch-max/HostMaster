#!/bin/bash
#
# Setup Script for Local Testing (Git Hooks)
# 
# This sets up automatic testing BEFORE you push code
# Runs on YOUR computer - 100% FREE (no cloud costs!)
#

echo "🛠️  Setting up free local testing with Git hooks..."
echo ""

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-push hook
if [ -f ".git-hooks/pre-push" ]; then
    cp .git-hooks/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    echo "✅ Pre-push hook installed"
else
    echo "❌ pre-push hook file not found"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "How it works:"
echo "  1. You make code changes"
echo "  2. You run 'git push'"
echo "  3. Tests run automatically on YOUR computer"
echo "  4. If tests pass → code is pushed"
echo "  5. If tests fail → push is blocked"
echo ""
echo "Benefits:"
echo "  ✅ 100% FREE (runs locally)"
echo "  ✅ No GitHub charges"
echo "  ✅ No cloud services needed"
echo "  ✅ Catches bugs before pushing"
echo ""
echo "To bypass tests (not recommended):"
echo "  git push --no-verify"
echo ""
