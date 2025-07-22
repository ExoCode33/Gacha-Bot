// index.js - Updated with Challenge Button Integration
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
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
        if (!user || !user.devilFruits || user.devilFruits.length < 5) {
            // Return some default fruits for testing
            return this.getRandomFruits(Math.floor(Math.random() * 5) + 5); // 5-10 fruits
        }
        return user.devilFruits;
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
        return shuffled.slice(0, count).map((fruit, index) => ({
            id: index + 1,
            fruit_name: fruit.name,
            fruit_type: fruit.type,
            fruit_rarity: this.getRandomRarity(),
            fruit_power: fruit.power,
            fruit_description: fruit.description
        }));
    }

    static getRandomRarity() {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        const weights = [40, 30, 20, 7, 2.5, 0.5];
        const random = Math.random() * 100;
        
        let cumulative = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return rarities[i];
            }
        }
        return 'common';
    }
}

// Enhanced Turn-Based PvP System (Fallback if main system unavailable)
class SimplePvPSystem {
    constructor() {
        this.activeBattles = new Map();
    }

    async initiateBattle(interaction, targetUser) {
        console.log(`🎮 Simple PvP: ${interaction.user.username} vs ${targetUser.username}`);
        
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Simple PvP Battle')
            .setDescription(`**${interaction.user.username}** vs **${targetUser.username}**\n\nSimple battle system activated!`)
            .setColor(0x3498DB)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    findUserBattle(userId) {
        return null; // No active battles in simple system
    }

    getBattleStats() {
        return { activeBattles: 0, battles: [] };
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
            
            console.log(`📝 Command: /${interaction.commandName} by ${interaction.user.username}`);
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

    console.log(`🔘 Button: ${customId} by ${user.username}`);

    // PRIORITY 1: Handle PvP Challenge Accept/Decline buttons (MOST IMPORTANT)
    if (customId.startsWith('pvp_challenge_accept_') || customId.startsWith('pvp_challenge_decline_')) {
        const enhancedPvpCommand = client.commands.get('pvp');
        if (enhancedPvpCommand && typeof enhancedPvpCommand.handleChallengeButtons === 'function') {
            console.log('🎯 Handling PvP challenge button');
            await enhancedPvpCommand.handleChallengeButtons(interaction);
            return;
        } else {
            console.error('❌ Enhanced PvP command or handleChallengeButtons method not found');
            return await interaction.reply({
                content: '❌ PvP challenge system is not available.',
                ephemeral: true
            });
        }
    }

    // PRIORITY 2: Handle Enhanced PvP System buttons (battle, fruit selection, etc.)
    if (customId.startsWith('accept_enhanced_battle_') || customId.startsWith('decline_enhanced_battle_')) {
        try {
            const EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
            const pvpSystem = new EnhancedTurnBasedPvP();
            console.log('🎮 Handling enhanced battle response');
            await pvpSystem.handleBattleResponse(interaction);
            return;
        } catch (error) {
            console.log('❌ Enhanced PvP system not available for battle response:', error.message);
        }
    }

    // PRIORITY 3: Handle other Enhanced PvP interactions
    if (customId.includes('enhanced') || customId.includes('fruit_selection') || 
        customId.includes('confirm_selection') || customId.includes('clear_selection') ||
        customId.includes('page_switch') || customId.includes('use_skill') ||
        customId.includes('surrender') || customId.includes('show_skills')) {
        try {
            const EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
            const pvpSystem = new EnhancedTurnBasedPvP();
            
            console.log('⚔️ Handling enhanced PvP interaction');
            
            // Handle different types of enhanced PvP interactions
            if (customId.startsWith('fruit_selection_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handleFruitSelection(interaction, battleId, userId, 'unknown');
            } else if (customId.startsWith('confirm_selection_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handleConfirmSelection(interaction, battleId, userId);
            } else if (customId.startsWith('clear_selection_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handleClearSelection(interaction, battleId, userId);
            } else if (customId.startsWith('page_switch_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handlePageSwitch(interaction, battleId, userId);
            } else if (customId.startsWith('use_skill_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -2).join('_');
                const userId = parts[parts.length - 2];
                const skillIndex = parseInt(parts[parts.length - 1]);
                await pvpSystem.handleSkillUsage(interaction, battleId, userId, skillIndex);
            } else if (customId.startsWith('show_skills_') || customId.startsWith('view_skills_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(2, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handleViewSkills(interaction, battleId, userId);
            } else if (customId.startsWith('surrender_')) {
                const parts = customId.split('_');
                const battleId = parts.slice(1, -1).join('_');
                const userId = parts[parts.length - 1];
                await pvpSystem.handleSurrender(interaction, battleId, userId);
            } else {
                console.log('❓ Unknown enhanced PvP interaction type');
                await interaction.reply({
                    content: '❌ Unknown PvP interaction type.',
                    ephemeral: true
                });
            }
            return;
        } catch (error) {
            console.error('❌ Error in enhanced PvP interaction:', error);
            await interaction.reply({
                content: '❌ Error processing PvP interaction.',
                ephemeral: true
            });
            return;
        }
    }

    // PRIORITY 4: Handle legacy PvP queue buttons (if any old ones exist)
    if (customId === 'join_pvp_queue') {
        if (client.pvpQueue.has(user.id)) {
            return await interaction.reply({ content: '❌ You are already in the PvP queue!', ephemeral: true });
        }

        await DatabaseManager.ensureUser(user.id, user.username);
        const userFruits = await DatabaseManager.getUserDevilFruits(user.id);
        
        if (userFruits.length < 5) {
            return await interaction.reply({ 
                content: '❌ You need at least 5 Devil Fruits to participate in PvP! Use `/pull` to get more fruits.', 
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
    // PRIORITY 5: Handle legacy battle buttons
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
    // PRIORITY 6: Unknown button
    else {
        console.log(`❓ Unknown button interaction: ${customId}`);
        await interaction.reply({
            content: '❌ Unknown button interaction.',
            ephemeral: true
        });
    }
}

async function handleSelectMenuInteraction(interaction) {
    const { customId, values, user } = interaction;

    console.log(`📋 Select menu: ${customId} by ${user.username}`);

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
    } else {
        await interaction.reply({
            content: '❌ Unknown select menu interaction.',
            ephemeral: true
        });
    }
}

async function startPvPMatch(player1, player2, interaction) {
    // Try to use enhanced system first
    try {
        const EnhancedTurnBasedPvP = require('./src/systems/pvp/enhanced-turn-based-pvp');
        const session = new EnhancedTurnBasedPvP();
        
        console.log(`⚔️ Starting enhanced PvP match: ${player1.username} vs ${player2.username}`);
        await session.initiateBattle(interaction, player2);
        return;
    } catch (error) {
        console.log('Enhanced PvP not available, using simple system:', error.message);
    }

    // Fallback to simple system
    const simplePvp = new SimplePvPSystem();
    await simplePvp.initiateBattle(interaction, player2);
}

// Login the bot
const token = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';
client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});

module.exports = client;
