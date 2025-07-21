// index.js - Main Bot File with Fixed PvP System
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Collections for commands and PvP sessions
client.commands = new Collection();
client.pvpSessions = new Collection();
client.pvpQueue = new Collection();

// Database Manager (simplified version)
class DatabaseManager {
    static users = new Map();
    static devilFruits = [
        { name: 'Gomu Gomu no Mi', type: 'Paramecia', power: 85, description: 'Rubber body abilities' },
        { name: 'Mera Mera no Mi', type: 'Logia', power: 90, description: 'Fire manipulation' },
        { name: 'Hie Hie no Mi', type: 'Logia', power: 88, description: 'Ice manipulation' },
        { name: 'Pika Pika no Mi', type: 'Logia', power: 95, description: 'Light manipulation' },
        { name: 'Magu Magu no Mi', type: 'Logia', power: 92, description: 'Magma manipulation' },
        { name: 'Gura Gura no Mi', type: 'Paramecia', power: 98, description: 'Earthquake generation' },
        { name: 'Yami Yami no Mi', type: 'Logia', power: 96, description: 'Darkness manipulation' },
        { name: 'Ope Ope no Mi', type: 'Paramecia', power: 87, description: 'Room creation and manipulation' },
        { name: 'Tori Tori no Mi Model: Phoenix', type: 'Mythical Zoan', power: 91, description: 'Phoenix transformation' },
        { name: 'Uo Uo no Mi Model: Azure Dragon', type: 'Mythical Zoan', power: 99, description: 'Azure Dragon transformation' }
    ];

    static async ensureUser(userId, username) {
        if (!this.users.has(userId)) {
            this.users.set(userId, {
                id: userId,
                username: username,
                devilFruits: [],
                wins: 0,
                losses: 0,
                rating: 1000
            });
        }
    }

    static async getUserDevilFruits(userId) {
        const user = this.users.get(userId);
        return user ? user.devilFruits : [];
    }

    static async addDevilFruit(userId, fruit) {
        const user = this.users.get(userId);
        if (user && user.devilFruits.length < 10) {
            user.devilFruits.push(fruit);
            return true;
        }
        return false;
    }

    static async updatePvPStats(winnerId, loserId) {
        const winner = this.users.get(winnerId);
        const loser = this.users.get(loserId);
        
        if (winner) {
            winner.wins += 1;
            winner.rating += 25;
        }
        if (loser) {
            loser.losses += 1;
            loser.rating = Math.max(100, loser.rating - 15);
        }
    }

    static getRandomFruits(count = 5) {
        const shuffled = [...this.devilFruits].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

// Enhanced Turn-Based PvP System
class EnhancedTurnBasedPvP {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.currentTurn = 1;
        this.currentPlayer = 'player1';
        this.gameState = 'fruit_selection';
        this.selectedFruits = {
            player1: null,
            player2: null
        };
        this.playerStats = {
            player1: { hp: 100, mp: 50, effects: [] },
            player2: { hp: 100, mp: 50, effects: [] }
        };
        this.battleLog = [];
        this.timeout = null;
    }

    createFruitSelectionEmbed(player) {
        return new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🍎 Devil Fruit Selection')
            .setDescription(`**${player.username}**, select your Devil Fruit for battle!`)
            .addFields([
                { name: '⚔️ Battle Info', value: 'Choose wisely - your fruit determines your abilities!' },
                { name: '⏰ Time Limit', value: '60 seconds to select' }
            ])
            .setThumbnail(player.displayAvatarURL())
            .setTimestamp();
    }

    createFruitSelectionMenu(userFruits) {
        const options = userFruits.slice(0, 25).map((fruit, index) => ({
            label: fruit.name,
            description: `${fruit.type} - Power: ${fruit.power}`,
            value: `fruit_${index}`,
            emoji: this.getFruitEmoji(fruit.type)
        }));

        return new StringSelectMenuBuilder()
            .setCustomId('select_fruit')
            .setPlaceholder('Choose your Devil Fruit...')
            .addOptions(options);
    }

    getFruitEmoji(type) {
        const emojis = {
            'Paramecia': '🟢',
            'Logia': '🔵',
            'Zoan': '🟡',
            'Mythical Zoan': '🟠'
        };
        return emojis[type] || '🍎';
    }

    createBattleEmbed() {
        const currentPlayerData = this.currentPlayer === 'player1' ? this.player1 : this.player2;
        const opponentData = this.currentPlayer === 'player1' ? this.player2 : this.player1;
        const currentStats = this.playerStats[this.currentPlayer];
        const opponentStats = this.playerStats[this.currentPlayer === 'player1' ? 'player2' : 'player1'];

        return new EmbedBuilder()
            .setColor(this.currentPlayer === 'player1' ? 0x3498DB : 0xE74C3C)
            .setTitle(`⚔️ Turn ${this.currentTurn} - ${currentPlayerData.username}'s Turn`)
            .setDescription(`🔥 **Enhanced Turn-Based Combat**`)
            .addFields([
                {
                    name: `${this.player1.username} ${this.selectedFruits.player1?.name}`,
                    value: `❤️ HP: ${this.playerStats.player1.hp}/100\n💙 MP: ${this.playerStats.player1.mp}/50`,
                    inline: true
                },
                {
                    name: 'VS',
                    value: '⚔️',
                    inline: true
                },
                {
                    name: `${this.player2.username} ${this.selectedFruits.player2?.name}`,
                    value: `❤️ HP: ${this.playerStats.player2.hp}/100\n💙 MP: ${this.playerStats.player2.mp}/50`,
                    inline: true
                }
            ])
            .setFooter({ text: `Turn: ${this.currentTurn} | ${currentPlayerData.username}'s turn` })
            .setTimestamp();
    }

    createBattleButtons() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('attack')
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('special_attack')
                    .setLabel('💥 Special Attack')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('defend')
                    .setLabel('🛡️ Defend')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ultimate')
                    .setLabel('🌟 Ultimate')
                    .setStyle(ButtonStyle.Success)
            );
    }

    async processAction(action, interaction) {
        const currentPlayerKey = this.currentPlayer;
        const opponentKey = this.currentPlayer === 'player1' ? 'player2' : 'player1';
        const currentFruit = this.selectedFruits[currentPlayerKey];
        const currentStats = this.playerStats[currentPlayerKey];
        const opponentStats = this.playerStats[opponentKey];

        let damage = 0;
        let actionText = '';

        switch (action) {
            case 'attack':
                damage = Math.floor(Math.random() * 25) + 15;
                actionText = `⚔️ Basic attack deals ${damage} damage!`;
                opponentStats.hp -= damage;
                break;

            case 'special_attack':
                if (currentStats.mp >= 15) {
                    damage = Math.floor(Math.random() * 35) + 20;
                    currentStats.mp -= 15;
                    actionText = `💥 ${currentFruit.name} special attack deals ${damage} damage! (-15 MP)`;
                    opponentStats.hp -= damage;
                } else {
                    actionText = '❌ Not enough MP for special attack!';
                }
                break;

            case 'defend':
                const heal = Math.floor(Math.random() * 15) + 10;
                currentStats.hp = Math.min(100, currentStats.hp + heal);
                currentStats.mp = Math.min(50, currentStats.mp + 10);
                actionText = `🛡️ Defended and recovered ${heal} HP and 10 MP!`;
                break;

            case 'ultimate':
                if (currentStats.mp >= 30) {
                    damage = Math.floor(Math.random() * 50) + 30;
                    currentStats.mp -= 30;
                    actionText = `🌟 ${currentFruit.name} ULTIMATE attack deals ${damage} damage! (-30 MP)`;
                    opponentStats.hp -= damage;
                } else {
                    actionText = '❌ Not enough MP for ultimate attack!';
                }
                break;
        }

        // Ensure HP doesn't go below 0
        opponentStats.hp = Math.max(0, opponentStats.hp);

        this.battleLog.push(actionText);

        // Check for winner
        if (opponentStats.hp <= 0) {
            return await this.endBattle(currentPlayerKey, interaction);
        }

        // Switch turns
        this.currentPlayer = opponentKey;
        this.currentTurn++;

        // Update the battle message
        const embed = this.createBattleEmbed();
        if (this.battleLog.length > 0) {
            embed.addFields([{
                name: '📜 Battle Log',
                value: this.battleLog.slice(-3).join('\n')
            }]);
        }

        await interaction.update({
            embeds: [embed],
            components: [this.createBattleButtons()]
        });

        return false;
    }

    async endBattle(winnerKey, interaction) {
        const winner = winnerKey === 'player1' ? this.player1 : this.player2;
        const loser = winnerKey === 'player1' ? this.player2 : this.player1;

        // Update database stats
        await DatabaseManager.updatePvPStats(winner.id, loser.id);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 Battle Complete!')
            .setDescription(`**${winner.username}** is victorious!`)
            .addFields([
                { name: '🎉 Winner', value: `${winner.username}`, inline: true },
                { name: '💀 Defeated', value: `${loser.username}`, inline: true },
                { name: '⚔️ Turns', value: `${this.currentTurn}`, inline: true },
                { name: '📜 Final Battle Log', value: this.battleLog.slice(-5).join('\n') || 'No actions recorded' }
            ])
            .setThumbnail(winner.displayAvatarURL())
            .setTimestamp();

        await interaction.update({
            embeds: [embed],
            components: []
        });

        // Clean up session
        client.pvpSessions.delete(this.player1.id);
        client.pvpSessions.delete(this.player2.id);

        return true;
    }
}

// Load commands
const commandsPath = path.join(__dirname, 'src', 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name}`);
            }
        } catch (error) {
            console.error(`❌ Error loading command ${file}:`, error);
        }
    }
}

// Event handlers
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // Register slash commands
    try {
        const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering slash commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                return await interaction.reply({ content: 'Command not found!', ephemeral: true });
            }
            await command.execute(interaction);
        }
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
        else if (interaction.isStringSelectMenu()) {
            await handleSelectMenuInteraction(interaction);
        }
    } catch (error) {
        console.error('❌ Interaction error:', error);
        const errorResponse = { content: 'An error occurred while processing your request.', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorResponse);
        } else {
            await interaction.reply(errorResponse);
        }
    }
});

async function handleButtonInteraction(interaction) {
    const { customId, user } = interaction;

    // PvP Queue buttons
    if (customId === 'join_pvp_queue') {
        if (client.pvpQueue.has(user.id)) {
            return await interaction.reply({ content: '❌ You are already in the PvP queue!', ephemeral: true });
        }

        await DatabaseManager.ensureUser(user.id, user.username);
        const userFruits = await DatabaseManager.getUserDevilFruits(user.id);
        
        if (userFruits.length < 5) {
            return await interaction.reply({ 
                content: '❌ You need at least 5 Devil Fruits to participate in PvP! Use `/spin` to get more fruits.', 
                ephemeral: true 
            });
        }

        client.pvpQueue.set(user.id, {
            user: user,
            timestamp: Date.now()
        });

        // Check for match
        const queueArray = Array.from(client.pvpQueue.values());
        if (queueArray.length >= 2) {
            const [player1Data, player2Data] = queueArray.slice(0, 2);
            
            // Remove from queue
            client.pvpQueue.delete(player1Data.user.id);
            client.pvpQueue.delete(player2Data.user.id);
            
            // Start PvP session
            await startPvPMatch(player1Data.user, player2Data.user, interaction);
        } else {
            await interaction.reply({ content: '⏳ Joined PvP queue! Waiting for an opponent...', ephemeral: true });
        }
    }
    else if (customId === 'leave_pvp_queue') {
        if (!client.pvpQueue.has(user.id)) {
            return await interaction.reply({ content: '❌ You are not in the PvP queue!', ephemeral: true });
        }

        client.pvpQueue.delete(user.id);
        await interaction.reply({ content: '✅ Left the PvP queue.', ephemeral: true });
    }
    // PvP Battle buttons
    else if (['attack', 'special_attack', 'defend', 'ultimate'].includes(customId)) {
        const session = client.pvpSessions.get(user.id);
        if (!session) {
            return await interaction.reply({ content: '❌ No active PvP session found!', ephemeral: true });
        }

        const currentPlayerData = session.currentPlayer === 'player1' ? session.player1 : session.player2;
        if (currentPlayerData.id !== user.id) {
            return await interaction.reply({ content: '❌ It\'s not your turn!', ephemeral: true });
        }

        await session.processAction(customId, interaction);
    }
}

async function handleSelectMenuInteraction(interaction) {
    const { customId, values, user } = interaction;

    if (customId === 'select_fruit') {
        const session = client.pvpSessions.get(user.id);
        if (!session || session.gameState !== 'fruit_selection') {
            return await interaction.reply({ content: '❌ No active fruit selection found!', ephemeral: true });
        }

        const fruitIndex = parseInt(values[0].replace('fruit_', ''));
        const userFruits = await DatabaseManager.getUserDevilFruits(user.id);
        const selectedFruit = userFruits[fruitIndex];

        if (!selectedFruit) {
            return await interaction.reply({ content: '❌ Invalid fruit selection!', ephemeral: true });
        }

        // Set the selected fruit
        if (session.player1.id === user.id) {
            session.selectedFruits.player1 = selectedFruit;
        } else {
            session.selectedFruits.player2 = selectedFruit;
        }

        await interaction.reply({ 
            content: `✅ Selected **${selectedFruit.name}** for battle!`, 
            ephemeral: true 
        });

        // Check if both players have selected fruits
        if (session.selectedFruits.player1 && session.selectedFruits.player2) {
            session.gameState = 'battle';
            
            // Start the battle
            const embed = session.createBattleEmbed();
            const buttons = session.createBattleButtons();

            // Find the original message and update it
            const channel = interaction.channel;
            const battleEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('⚔️ Battle Begins!')
                .setDescription(`**${session.player1.username}** vs **${session.player2.username}**\n\nBoth players have selected their Devil Fruits!`)
                .addFields([
                    { 
                        name: `${session.player1.username}'s Fruit`, 
                        value: `${session.selectedFruits.player1.name}\n*${session.selectedFruits.player1.description}*`,
                        inline: true 
                    },
                    { name: 'VS', value: '⚔️', inline: true },
                    { 
                        name: `${session.player2.username}'s Fruit`, 
                        value: `${session.selectedFruits.player2.name}\n*${session.selectedFruits.player2.description}*`,
                        inline: true 
                    }
                ]);

            await channel.send({ embeds: [battleEmbed] });

            setTimeout(async () => {
                await channel.send({ 
                    embeds: [embed], 
                    components: [buttons] 
                });
            }, 2000);
        }
    }
}

async function startPvPMatch(player1, player2, interaction) {
    const session = new EnhancedTurnBasedPvP(player1, player2);
    
    // Store session for both players
    client.pvpSessions.set(player1.id, session);
    client.pvpSessions.set(player2.id, session);

    // Get user fruits
    await DatabaseManager.ensureUser(player1.id, player1.username);
    await DatabaseManager.ensureUser(player2.id, player2.username);
    
    const player1Fruits = await DatabaseManager.getUserDevilFruits(player1.id);
    const player2Fruits = await DatabaseManager.getUserDevilFruits(player2.id);

    // If users don't have enough fruits, give them some
    if (player1Fruits.length < 5) {
        const randomFruits = DatabaseManager.getRandomFruits(5);
        for (const fruit of randomFruits) {
            await DatabaseManager.addDevilFruit(player1.id, fruit);
        }
    }
    if (player2Fruits.length < 5) {
        const randomFruits = DatabaseManager.getRandomFruits(5);
        for (const fruit of randomFruits) {
            await DatabaseManager.addDevilFruit(player2.id, fruit);
        }
    }

    // Create match found embed
    const matchEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎯 PvP Match Found!')
        .setDescription(`**${player1.username}** vs **${player2.username}**`)
        .addFields([
            { name: '⚔️ Battle Type', value: 'Enhanced Turn-Based Combat' },
            { name: '🍎 Next Step', value: 'Both players must select their Devil Fruits!' }
        ])
        .setTimestamp();

    await interaction.channel.send({ embeds: [matchEmbed] });

    // Send fruit selection to both players
    const updatedPlayer1Fruits = await DatabaseManager.getUserDevilFruits(player1.id);
    const updatedPlayer2Fruits = await DatabaseManager.getUserDevilFruits(player2.id);

    try {
        const player1Embed = session.createFruitSelectionEmbed(player1);
        const player1Menu = session.createFruitSelectionMenu(updatedPlayer1Fruits);
        await player1.send({ 
            embeds: [player1Embed], 
            components: [new ActionRowBuilder().addComponents(player1Menu)] 
        });

        const player2Embed = session.createFruitSelectionEmbed(player2);
        const player2Menu = session.createFruitSelectionMenu(updatedPlayer2Fruits);
        await player2.send({ 
            embeds: [player2Embed], 
            components: [new ActionRowBuilder().addComponents(player2Menu)] 
        });

        await interaction.channel.send({ 
            content: `📨 Fruit selection menus sent to ${player1.username} and ${player2.username} via DM!` 
        });
    } catch (error) {
        console.error('Error sending DMs:', error);
        await interaction.channel.send({ 
            content: '❌ Could not send DMs to players. Make sure your DMs are open!' 
        });
    }
}

// Login the bot
const token = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';
client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});

module.exports = client;
