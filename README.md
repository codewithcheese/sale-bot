# Sale bot

Daily shopping list of sale items by scraping local stores for products you like.

Intended for personal use, running on a home server. Access via tailscale.

## Install

Clone
```bash
git clone https://github.com/codewithcheese/sale-bot.git
```

Install dependencies
```bash
npm install
```

Build
```bash
npm run build
```

Install service
```bash
ln ~/sale-bot/sale-bot.service ~/.config/systemd/user/sale-bot.service
systemctl --user enable sale-bot.service
```

## TODO

- order shopping list by priority, sale pct
- checkbox to use while shopping
- favicon
