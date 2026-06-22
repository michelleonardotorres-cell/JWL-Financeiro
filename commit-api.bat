@echo off
git add -A
git commit -m "fix: replace direct Xata SDK with Vercel Serverless API routes" -m "- Created /api routes using pg client" -m "- Updated mockData.ts to fetch from /api endpoints" -m "- Added vercel.json rewrites for /api paths"
git push
