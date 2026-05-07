# 🎮 FiveM Discord Bot

A Discord bot for monitoring your FiveM server — live player list, gang member tracker, and staff online checker. All embeds auto-update in real time.

---

## ✨ Features

| Command | Description | Update Rate |
|---|---|---|
| `/playerlist` | Shows all players on the server with ID & ping | Every 10s |
| `/gangonline` | Shows your gang members — 🟢 online / 🔴 offline | Every 5s |
| `/staffonline` | Shows your staff members — 🟢 online / 🔴 offline with ID & ping | Every 5s |

- All embeds **edit themselves** in place — no spam
- **⏹ Stop Live Updates** button to stop any tracker manually
- Runs forever until you stop it

---

## 📋 Requirements

- [Node.js](https://nodejs.org) **v18 or higher**
- A Discord account with a server you own or manage
- Your FiveM server must be publicly accessible

---

## 🚀 Step-by-Step Setup

### Step 1 — Download the bot files

You need two files in the same folder:
- `bot.js`
- `package.json`

Create a folder anywhere on your computer (e.g. `fivem-bot`) and place both files inside it.

---

### Step 2 — Install Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the green button)
3. Install it — just click Next through the installer
4. To verify it worked, open a terminal/command prompt and run:
```
node --version
```
You should see something like `v20.11.0`

---

### Step 3 — Install bot dependencies

1. Open a terminal / command prompt
2. Navigate to your bot folder:
```
cd path/to/fivem-bot
```
3. Run:
```
npm install
```
This installs the `discord.js` library automatically from `package.json`.

---

### Step 4 — Create a Discord Application & Bot

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** in the top right
3. Give it a name (e.g. `FiveM Monitor`) and click **Create**

#### Get your Client ID
4. You are now on the **General Information** page
5. Copy the **Application ID** — this is your `CLIENT_ID`

#### Create the Bot account
6. Click **Bot** in the left sidebar
7. Click **Add Bot** → **Yes, do it!**
8. Under the bot's username, click **Reset Token** → **Yes, do it!**
9. Copy the token that appears — this is your `TOKEN` ⚠️ **Never share this with anyone**
10. Scroll down and make sure **Message Content Intent** is turned **ON**

---

### Step 5 — Invite the bot to your Discord server

1. In the Developer Portal, click **OAuth2** → **URL Generator** in the left sidebar
2. Under **Scopes**, check:
   - `bot`
   - `applications.commands`
3. Under **Bot Permissions**, check:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
4. Copy the generated URL at the bottom and open it in your browser
5. Select your Discord server and click **Authorize**

---

### Step 6 — Get your Server (Guild) ID

1. Open Discord
2. Go to **Settings → Advanced** and turn on **Developer Mode**
3. Right-click your Discord server name in the left sidebar
4. Click **Copy Server ID** — this is your `GUILD_ID`

---

### Step 7 — Edit the CONFIG in bot.js

Open `bot.js` in any text editor (Notepad, VS Code, etc.) and fill in the top section:

```js
const CONFIG = {
  TOKEN: 'YOUR_BOT_TOKEN_HERE',      // from Step 4
  CLIENT_ID: 'YOUR_CLIENT_ID_HERE',  // from Step 4
  GUILD_ID: 'YOUR_GUILD_ID_HERE',    // from Step 6
```

---

### Step 8 — Set your Gang name and members

Still in `bot.js`, find the Gang section:

```js
GANG_NAME: 'Sons of Legacy',   // change to your gang name

GANG_MEMBERS: {
  'DISCORD_USER_ID': 'Exact In-Game Name',
  'DISCORD_USER_ID': 'Exact In-Game Name',
},
```

#### How to get a Discord User ID
1. Make sure Developer Mode is ON (Step 6)
2. Right-click the member's name in Discord
3. Click **Copy User ID**

#### How to get the exact In-Game Name
The name must match **exactly** what appears in your FiveM server's player list. To find it:
1. Start the bot (Step 9)
2. Check your terminal — it prints every player name from the server when `/gangonline` is used
3. Copy the name exactly as shown and paste it into `GANG_MEMBERS`

---

### Step 9 — Set your Staff name and members

Same as Step 8 but for the staff section:

```js
STAFF_TEAM_NAME: 'Server Staff',   // change to your staff team name

STAFF_MEMBERS: {
  'DISCORD_USER_ID': 'Exact In-Game Name',
  'DISCORD_USER_ID': 'Exact In-Game Name',
},
```

Staff embeds also show **Server ID** and **Ping** for each online member.

---

### Step 10 — Start the bot

In your terminal (inside the bot folder) run:
```
node bot.js
```

You should see:
```
✅ Logged in as FiveM Monitor#1234
✅ Slash commands registered
```

The bot is now online! Go to your Discord server and try the commands.

---

## 💬 Using the Commands

All commands take the same arguments:

```
/playerlist ip:123.456.789.0 port:30120
/gangonline ip:123.456.789.0 port:30120
/staffonline ip:123.456.789.0 port:30120
```

> **Port is optional** — it defaults to `30120` if you leave it blank.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| Bot is online but commands don't appear | Wait 1–2 minutes after first start for Discord to register slash commands |
| `❌ Failed to Fetch Players` | Your FiveM server IP/port is wrong or the server is offline |
| Members always show as 🔴 offline | In-game names don't match exactly — check your terminal console for the real names printed by the bot |
| `Error: TOKEN is invalid` | You copied the Client ID instead of the Bot Token — go back to Step 4 |
| Bot crashes on startup | Make sure Node.js v18+ is installed and you ran `npm install` |

---

## 📁 File Structure

```
fivem-bot/
├── bot.js          ← main bot file (edit CONFIG at the top)
├── package.json    ← dependencies
└── README.md       ← this file
```

---

## ⚠️ Important Notes

- **Never share your bot TOKEN** — anyone with it can control your bot
- The bot only works while `node bot.js` is running. To keep it online 24/7, host it on a VPS or use a process manager like [PM2](https://pm2.keymetrics.io/)
- In-game names are matched **case-insensitively** but spaces and special characters must be exact

---

## 🖥️ Running 24/7 with PM2 (optional)

If you want the bot to stay online even after closing your terminal:

```
npm install -g pm2
pm2 start bot.js --name fivem-bot
pm2 save
pm2 startup
```

To stop it:
```
pm2 stop fivem-bot
```

---

*Made for FiveM RP communities.*
