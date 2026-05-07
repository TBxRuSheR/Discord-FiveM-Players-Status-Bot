const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
} = require('discord.js');

// ============================================================
//  CONFIG — edit these values
// ============================================================
const CONFIG = {
  TOKEN: 'BOT_TOKEN_HERE',       // Your Discord bot token
  CLIENT_ID: 'CLIENT_ID_HERE',   // Your bot's application/client ID
  GUILD_ID: 'GUILD_ID_HERE',     // The server/guild ID where you want to register commands

  // ── Gang ──────────────────────────────────────────────────
  GANG_NAME: 'Your Gang Name Here',

  // 'Discord User ID': 'Exact In-Game Name'
  GANG_MEMBERS: {
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
    
    
    // 'DISCORD_USER_ID': 'Exact In-Game Name',
  },

  // ── Staff ─────────────────────────────────────────────────
  STAFF_TEAM_NAME: 'Server Staff',  // shown in the embed title

  // 'Discord User ID': 'Exact In-Game Name'
  STAFF_MEMBERS: {
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
    'DISCORD_USER_ID': 'Exact In-Game Name',
  },
};
// ============================================================

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// messageId → { intervalId, type }
const activeTrackers = new Map();

// ── Helpers ──────────────────────────────────────────────────

async function fetchFiveMPlayers(ip, port) {
  const res = await fetch(`http://${ip}:${port}/players.json`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function chunkList(items) {
  const chunks = [];
  let current = '';
  for (const item of items) {
    if (current.length + item.length + 1 > 1020) {
      chunks.push(current.trimEnd());
      current = '';
    }
    current += item + '\n';
  }
  if (current) chunks.push(current.trimEnd());
  return chunks;
}

function makeStopRow(customId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('⏹ Stop Live Updates')
      .setStyle(ButtonStyle.Danger)
  );
}

// ── Generic online/offline embed builder (used by both gang & staff) ──

function buildMemberEmbed({ players, ip, port, updateCount, members, title, emoji, color, interval, showStats }) {
  const onlineNames = new Map(players.map(p => [p.name.toLowerCase(), p]));
  const onlineMembers  = [];
  const offlineMembers = [];

  for (const [discordId, inGameName] of Object.entries(members)) {
    const playerData = onlineNames.get(inGameName.toLowerCase());
    if (playerData) {
      onlineMembers.push({ discordId, inGameName, id: playerData.id, ping: playerData.ping });
    } else {
      offlineMembers.push({ discordId, inGameName });
    }
  }

  const onlineLines = onlineMembers.map(m => {
    const base = `🟢 **${m.inGameName}** (<@${m.discordId}>)`;
    return showStats ? `${base} — ID: ${m.id} | Ping: ${m.ping}ms` : base;
  });
  const offlineLines = offlineMembers.map(m => `🔴 **${m.inGameName}** (<@${m.discordId}>)`);

  return new EmbedBuilder()
    .setColor(onlineMembers.length ? color : 0xff4444)
    .setTitle(`${emoji} ${title}`)
    .setDescription(
      `**Server:** \`${ip}:${port}\`\n` +
      `**Members Online:** ${onlineMembers.length} / ${Object.keys(members).length}`
    )
    .setTimestamp()
    .setFooter({ text: `🔄 Auto-updating every ${interval}s  •  Update #${updateCount}` })
    .addFields(
      {
        name: '✅ Online Members',
        value: onlineLines.length ? onlineLines.join('\n') : '```\nNo members online\n```',
      },
      {
        name: '💤 Offline Members',
        value: offlineLines.length ? offlineLines.join('\n') : '```\nAll members are online!\n```',
      }
    );
}

// ── Embed builders ───────────────────────────────────────────

function buildPlayerEmbed(players, ip, port, updateCount) {
  if (!players.length) {
    return new EmbedBuilder()
      .setColor(0xf0a500)
      .setTitle('🟡 Server is Empty')
      .setDescription(`No players found on \`${ip}:${port}\``)
      .setTimestamp()
      .setFooter({ text: `🔄 Auto-updating every 10s  •  Update #${updateCount}` });
  }

  const lines = players.map(
    (p, i) =>
      `\`${String(i + 1).padStart(2, '0')}\` **${p.name}** — ID: ${p.id} | Ping: ${p.ping}ms`
  );

  const embed = new EmbedBuilder()
    .setColor(0x00b4d8)
    .setTitle(`🟢 FiveM Player List — ${ip}:${port}`)
    .setDescription(`**${players.length} player(s) online**`)
    .setTimestamp()
    .setFooter({ text: `🔄 Auto-updating every 10s  •  Update #${updateCount}` });

  chunkList(lines).forEach((chunk, idx) => {
    embed.addFields({ name: idx === 0 ? '👥 Players' : '\u200b', value: chunk });
  });

  return embed;
}

// ── Slash command definitions ────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName('playerlist')
    .setDescription('Show all players currently on a FiveM server')
    .addStringOption(o =>
      o.setName('ip').setDescription('Server IP address').setRequired(true))
    .addIntegerOption(o =>
      o.setName('port').setDescription('Server port (default 30120)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('gangonline')
    .setDescription('Check which gang members are online on a FiveM server')
    .addStringOption(o =>
      o.setName('ip').setDescription('Server IP address').setRequired(true))
    .addIntegerOption(o =>
      o.setName('port').setDescription('Server port (default 30120)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('staffonline')
    .setDescription('Check which staff members are online on a FiveM server')
    .addStringOption(o =>
      o.setName('ip').setDescription('Server IP address').setRequired(true))
    .addIntegerOption(o =>
      o.setName('port').setDescription('Server port (default 30120)').setRequired(false)),

].map(c => c.toJSON());

// ── Register commands ────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error('❌ Command registration failed:', err);
  }
});

// ── Reusable live-tracker launcher ───────────────────────────

async function startLiveTracker({ interaction, ip, port, stopButtonId, intervalMs, buildEmbed, errorTitle }) {
  let players;
  try {
    players = await fetchFiveMPlayers(ip, port);
  } catch (err) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle(`❌ ${errorTitle}`)
          .setDescription(`Could not reach \`${ip}:${port}\`.\n\n**Error:** ${err.message}`)
          .setTimestamp(),
      ],
    });
  }

  const stopRow = makeStopRow(stopButtonId);
  let updateCount = 1;

  await interaction.editReply({
    embeds: [buildEmbed(players, updateCount)],
    components: [stopRow],
  });

  const msg = await interaction.fetchReply();

  if (activeTrackers.has(msg.id)) clearInterval(activeTrackers.get(msg.id).intervalId);

  const intervalId = setInterval(async () => {
    updateCount++;
    try {
      const fresh = await fetchFiveMPlayers(ip, port);
      await msg.edit({
        embeds: [buildEmbed(fresh, updateCount)],
        components: [stopRow],
      });
    } catch (err) {
      console.error(`Tracker error [${stopButtonId}]:`, err.message);
      clearInterval(intervalId);
      activeTrackers.delete(msg.id);
    }
  }, intervalMs);

  activeTrackers.set(msg.id, { intervalId });
}

// ── Slash command handler ────────────────────────────────────

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const ip   = interaction.options.getString('ip');
  const port = interaction.options.getInteger('port') ?? 30120;

  await interaction.deferReply();

  // ── /playerlist ──────────────────────────────────────────
  if (interaction.commandName === 'playerlist') {
    await startLiveTracker({
      interaction, ip, port,
      stopButtonId: 'stop_player_tracker',
      intervalMs: 10_000,
      errorTitle: 'Failed to Fetch Players',
      buildEmbed: (players, updateCount) => buildPlayerEmbed(players, ip, port, updateCount),
    });
  }

  // ── /gangonline ──────────────────────────────────────────
  if (interaction.commandName === 'gangonline') {
    await startLiveTracker({
      interaction, ip, port,
      stopButtonId: 'stop_gang_tracker',
      intervalMs: 5_000,
      errorTitle: 'Failed to Fetch Gang Status',
      buildEmbed: (players, updateCount) => buildMemberEmbed({
        players, ip, port, updateCount,
        members: CONFIG.GANG_MEMBERS,
        title: `Gang Name: ${CONFIG.GANG_NAME}`,
        emoji: '🏴',
        color: 0x00ff99,
        interval: 5,
        showStats: false,
      }),
    });
  }

  // ── /staffonline ─────────────────────────────────────────
  if (interaction.commandName === 'staffonline') {
    await startLiveTracker({
      interaction, ip, port,
      stopButtonId: 'stop_staff_tracker',
      intervalMs: 5_000,
      errorTitle: 'Failed to Fetch Staff Status',
      buildEmbed: (players, updateCount) => buildMemberEmbed({
        players, ip, port, updateCount,
        members: CONFIG.STAFF_MEMBERS,
        title: `Staff Team: ${CONFIG.STAFF_TEAM_NAME}`,
        emoji: '🛡️',
        color: 0x5865f2,
        interval: 5,
        showStats: true,
      }),
    });
  }
});

// ── Button handler ───────────────────────────────────────────

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const validButtons = ['stop_gang_tracker', 'stop_player_tracker', 'stop_staff_tracker'];
  if (!validButtons.includes(interaction.customId)) return;

  const msgId = interaction.message.id;

  if (activeTrackers.has(msgId)) {
    clearInterval(activeTrackers.get(msgId).intervalId);
    activeTrackers.delete(msgId);
  }

  let title = '🟢 FiveM Player List';
  if (interaction.customId === 'stop_gang_tracker')  title = `🏴 Gang Name: ${CONFIG.GANG_NAME}`;
  if (interaction.customId === 'stop_staff_tracker') title = `🛡️ Staff Team: ${CONFIG.STAFF_TEAM_NAME}`;

  const stoppedEmbed = new EmbedBuilder()
    .setColor(0x888888)
    .setTitle(title)
    .setDescription('⏹ Live updates have been stopped.\nUse the command again to restart.')
    .setTimestamp()
    .setFooter({ text: 'Stopped by user' });

  await interaction.update({ embeds: [stoppedEmbed], components: [] });
});

// ── Start ────────────────────────────────────────────────────

client.login(CONFIG.TOKEN);