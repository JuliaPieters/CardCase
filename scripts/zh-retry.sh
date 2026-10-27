#!/bin/zsh
# Finishes the Taiwanese cards once asia.pokemon-card.com is back: run every few hours by launchd
# (~/Library/LaunchAgents/nl.cardcase.zh-retry.plist). While the site is down it does nothing; once it's up it runs
# the sync and commits the catalog (not pushed). When no card details are missing any more it switches itself off.

cd "${0:A:h}/.." || exit 1
export PATH="$HOME/.nvm/versions/node/v26.9.0/bin:$PATH"
echo "== $(date)"

if [ "$(curl -s -o /dev/null -w '%{http_code}' https://asia.pokemon-card.com/tw/)" != "200" ]; then
  echo "site nog niet bereikbaar"
  exit 0
fi

npm run sync-chinese 2>&1 | grep -v '^  '

if [ "$(git branch --show-current)" = "main" ] && ! git diff --quiet -- public scripts/cache; then
  git add public/catalog.json public/card-hashes.bin scripts/cache/zh-details.json scripts/cache/zh-list.json
  git commit -q -m "Fetch the remaining Taiwanese cards from the official Asian card database" \
    -- public/catalog.json public/card-hashes.bin scripts/cache/zh-details.json scripts/cache/zh-list.json
  git log --oneline -1
fi

missing=$(node -e '
const d = require("./scripts/cache/zh-details.json"), l = require("./scripts/cache/zh-list.json");
console.log(l.filter((id) => !d[id]).length)')
echo "nog $missing kaartdetails ontbreken"
if [ "$missing" = "0" ]; then
  echo "klaar, taak uitgezet"
  launchctl bootout "gui/$(id -u)/nl.cardcase.zh-retry"
fi
