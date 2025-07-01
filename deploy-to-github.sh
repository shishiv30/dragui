#!/bin/bash

echo "🚀 GitHub Deployment Helper Script"
echo "=================================="
echo ""

# Check if git remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub remote configured yet."
    echo ""
    echo "📋 Please follow these steps:"
    echo "1. Go to https://github.com and create a new repository named 'dragui'"
    echo "2. Make it PUBLIC (required for free GitHub Pages)"
    echo "3. Don't initialize with README, .gitignore, or license"
    echo "4. Copy the repository URL (it will look like: https://github.com/YOUR_USERNAME/dragui.git)"
    echo ""
    echo "Then run these commands:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/dragui.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    echo "After that, run this script again to continue with deployment."
    exit 1
fi

echo "✅ GitHub remote is configured"
echo ""

# Get the repository URL
REPO_URL=$(git remote get-url origin)
echo "📦 Repository: $REPO_URL"
echo ""

# Extract username from repo URL
if [[ $REPO_URL =~ github\.com/([^/]+)/dragui ]]; then
    USERNAME=${BASH_REMATCH[1]}
    echo "👤 GitHub Username: $USERNAME"
    echo ""
    echo "🌐 Your GitHub Pages URL will be:"
    echo "   https://$USERNAME.github.io/dragui/"
    echo ""
else
    echo "⚠️  Could not extract username from repository URL"
    echo "   Expected format: https://github.com/USERNAME/dragui.git"
fi

echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Enable GitHub Pages:"
echo "   - Go to your repository on GitHub"
echo "   - Click 'Settings' tab"
echo "   - Scroll to 'Pages' section (left sidebar)"
echo "   - Under 'Source', select 'GitHub Actions'"
echo ""
echo "3. The workflow will automatically build and deploy your app"
echo "   You can monitor progress in the 'Actions' tab"
echo ""
echo "4. Once deployed, your app will be available at:"
echo "   https://$USERNAME.github.io/dragui/"
echo ""

# Check if we need to push
if [[ $(git status --porcelain) ]]; then
    echo "⚠️  You have uncommitted changes. Please commit and push first:"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    echo "   git push origin main"
else
    echo "✅ All changes are committed"
    echo "   Ready to push: git push origin main"
fi

echo ""
echo "🎉 Happy deploying!" 