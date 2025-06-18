#!/usr/bin/env bash

# Simple script to verify vercel.json is being included in your deployment

echo "Checking vercel.json status..."
echo "------------------------------"

# Check if vercel.json exists
if [ -f "vercel.json" ]; then
  echo "✅ vercel.json exists"
  echo "Content of vercel.json:"
  cat vercel.json
else
  echo "❌ vercel.json does not exist"
fi

echo ""
echo "Git status for vercel.json:"
git status vercel.json -s

echo ""
echo "Making sure vercel.json is added to git:"
git add vercel.json

echo ""
echo "Checking if vercel.json is in the staged changes:"
git status vercel.json -s

echo ""
echo "Your vercel.json is now ready to be committed and pushed."
echo "Run: git commit -m \"Updated vercel.json\" && git push"
