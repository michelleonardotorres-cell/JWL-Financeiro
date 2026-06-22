@echo off
git add -A
git commit -m "feat: integrate Xata cloud database with bidirectional sync" -m "- initializeXataSync fetches from Xata on startup and seeds if empty" -m "- Debounced background sync on every data mutation" -m "- Loading spinner in App.tsx during initial sync" -m "- TypeScript type fix for Obra status union cast"
git push
