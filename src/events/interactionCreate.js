const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Import the queue manager from pvp-queue command
const { queueManager } = require('../commands/pvp-queue');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const errorMessage = { 
                    content: 'There was an error while executing this command!', 
                    flags: 64 // MessageFlags.Ephemeral
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            // PvP System Buttons
            if (interaction.customId.includes('pvp') || 
                interaction.customId.includes('leave_pvp_queue') || 
                interaction.customId.includes('start_battle') ||
                interaction.customId.includes('cancel_match') ||
                interaction.customId.includes('refresh_queue_status')) {
                
                await handlePvPButtons(interaction);
                return;
            }

            // Add other button handlers here for your existing bot features
        }
    }
};

// PvP Button Handler Functions
async function handlePvPButtons(interaction) {
    const customId = interaction.customId;
    const userId = interaction.user.id;

    try {
        if (customId === 'leave_pvp_queue') {
            await handleLeaveQueueButton(interaction, userId);
        } else if (customId === 'refresh_queue_status') {
            await handleRefreshQueueButton(interaction, userId);
        } else if (customId.startsWith('start_battle_')) {
            const matchId = customId.replace('start_battle_', '');
            await handleStartBattleButton(interaction, userId, matchId);
        } else if (customId.startsWith('cancel_match_')) {
            const matchId = customId.replace('cancel_match_', '');
            await handleCancelMatchButton(interaction, userId, matchId);
        } else if (customId.startsWith('pvp_action_')) {
            await handleBattleAction(interaction, userId, customId);
        }
    } catch (error) {
        console.error('PvP Button Handler Error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing your action.',
                flags: 64
            });
        }
    }
}

async function handleLeaveQueueButton(interaction, userId) {
    const queue = queueManager.getQueue();
    
    if (!queue.has(userId)) {
        return await interaction.reply({
            content: '⚠️ You are not in the PvP queue!',
            flags: 64
        });
    }

    const playerData = queue.get(userId);
    const waitTime = Math.floor((Date.now() - playerData.joinTime) / 1000);
    queue.delete(userId);

    const leaveEmbed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('❌ Left PvP Queue')
        .setDescription(`**${interaction.user.displayName}** left the matchmaking queue.`)
        .addFields(
            { name: '⏱️ Time in Queue', value: `${waitTime} seconds`, inline: true },
            { name: '👥 Players Remaining', value: `${queue.size}`, inline: true }
        )
        .setTimestamp();

    try {
        await interaction.update({
            embeds: [leaveEmbed],
            components: []
        });
    } catch (error) {
        await interaction.reply({
            embeds: [leaveEmbed],
            flags: 64
        });
    }
}

async function handleRefreshQueueButton(interaction, userId) {
    const queue = queueManager.getQueue();
    const playerData = queue.get(userId);
    
    if (!playerData) {
        return await interaction.reply({
            content: '⚠️ You are not in the PvP queue!',
            flags: 64
        });
    }

    const waitTime = Math.floor((Date.now() - playerData.joinTime) / 1000);
    const minutes = Math.floor(waitTime / 60);
    const seconds = waitTime % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const refreshEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🔄 Queue Status Updated')
        .setDescription(`**${interaction.user.displayName}** - Still searching for opponent...`)
        .addFields(
            { name: '⚡ Your CP', value: `${playerData.cp.toLocaleString()}`, inline: true },
            { name: '👥 Queue Position', value: getQueuePosition(userId), inline: true },
            { name: '⏱️ Time Waiting', value: timeStr, inline: true },
            { name: '📊 Current Range', value: getCurrentMatchRange(playerData.cp, waitTime), inline: false }
        )
        .setTimestamp();

    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('leave_pvp_queue')
                .setLabel('Leave Queue')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌'),
            new ButtonBuilder()
                .setCustomId('refresh_queue_status')
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
        );

    await interaction.update({
        embeds: [refreshEmbed],
        components: [actionRow]
    });
}

async function handleStartBattleButton(interaction, userId, matchId) {
    const activeMatches = queueManager.getActiveMatches();
    const match = activeMatches.get(matchId);

    if (!match) {
        return await interaction.reply({
            content: '❌ This match has expired or no longer exists.',
            flags: 64
        });
    }

    // Check if user is part of this match
    if (match.player1.id !== userId && match.player2.id !== userId) {
        return await interaction.reply({
            content: '❌ You are not part of this match!',
            flags: 64
        });
    }

    // Check if match is still in starting phase
    if (match.status !== 'starting') {
        return await interaction.reply({
            content: '❌ This match has already started or ended.',
            flags: 64
        });
    }

    // Update match status
    match.status = 'active';
    match.lastActivity = Date.now();

    // Create battle start embed
    const battleEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Battle Commenced!')
        .setDescription(`The epic clash between **${match.player1.user.displayName}** and **${match.player2.user.displayName}** begins!`)
        .addFields(
            { 
                name: '🥊 Fighter 1', 
                value: `**${match.player1.user.displayName}**\n⚡ CP: ${match.player1.cp.toLocaleString()}\n❤️ HP: ${match.player1.hp}/${match.player1.maxHp}\n💫 Energy: ${match.player1.energy}/3`, 
                inline: true 
            },
            { 
                name: '⚡', 
                value: `**Round ${match.round}**\n\n**Current Turn:**\n<@${match.currentTurn}>\n\n⏰ 45 seconds`, 
                inline: true 
            },
            { 
                name: '🥊 Fighter 2', 
                value: `**${match.player2.user.displayName}**\n⚡ CP: ${match.player2.cp.toLocaleString()}\n❤️ HP: ${match.player2.hp}/${match.player2.maxHp}\n💫 Energy: ${match.player2.energy}/3`, 
                inline: true 
            }
        )
        .setFooter({ text: `Match ID: ${matchId} | Choose your action wisely!` })
        .setTimestamp();

    // Create battle action buttons
    const battleActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`pvp_action_attack_${matchId}`)
                .setLabel('Attack')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚔️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_defend_${matchId}`)
                .setLabel('Defend')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_special_${matchId}`)
                .setLabel('Special Move')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💥')
                .setDisabled(match.currentTurn === match.player1.id ? match.player1.energy < 1 : match.player2.energy < 1)
        );

    const utilityActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`pvp_action_forfeit_${matchId}`)
                .setLabel('Forfeit')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🏳️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_stats_${matchId}`)
                .setLabel('Battle Stats')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
        );

    try {
        await interaction.update({
            content: `🎮 **BATTLE ACTIVE** | <@${match.currentTurn}> **YOUR TURN!**`,
            embeds: [battleEmbed],
            components: [battleActions, utilityActions]
        });

        // Set up turn timer (45 seconds per turn)
        startTurnTimer(matchId, match.currentTurn, 45000);

    } catch (error) {
        console.error('Error starting battle:', error);
        await interaction.followUp({
            content: '❌ Failed to start the battle. Please try again.',
            flags: 64
        });
    }
}

async function handleCancelMatchButton(interaction, userId, matchId) {
    const activeMatches = queueManager.getActiveMatches();
    const match = activeMatches.get(matchId);

    if (!match) {
        return await interaction.reply({
            content: '❌ This match no longer exists.',
            flags: 64
        });
    }

    // Check if user is part of this match
    if (match.player1.id !== userId && match.player2.id !== userId) {
        return await interaction.reply({
            content: '❌ You are not part of this match!',
            flags: 64
        });
    }

    // Remove match
    activeMatches.delete(matchId);

    const cancelEmbed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle('❌ Match Cancelled')
        .setDescription(`The match between **${match.player1.user.displayName}** and **${match.player2.user.displayName}** has been cancelled.`)
        .addFields(
            { name: '🔄 Next Steps', value: 'Both players can rejoin the queue whenever ready.', inline: false }
        )
        .setTimestamp();

    await interaction.update({
        content: `Match cancelled by <@${userId}>`,
        embeds: [cancelEmbed],
        components: []
    });
}

async function handleBattleAction(interaction, userId, customId) {
    const parts = customId.split('_');
    const action = parts[2]; // Get action type
    const matchId = parts.slice(3).join('_'); // Get match ID (handle underscores in ID)
    
    const activeMatches = queueManager.getActiveMatches();
    const match = activeMatches.get(matchId);

    if (!match) {
        return await interaction.reply({
            content: '❌ This match no longer exists.',
            flags: 64
        });
    }

    // Check if it's the user's turn
    if (match.currentTurn !== userId) {
        const currentPlayer = match.currentTurn === match.player1.id ? match.player1.user.displayName : match.player2.user.displayName;
        return await interaction.reply({
            content: `⚠️ It's not your turn! Waiting for **${currentPlayer}** to act.`,
            flags: 64
        });
    }

    // Check if user is part of this match
    if (match.player1.id !== userId && match.player2.id !== userId) {
        return await interaction.reply({
            content: '❌ You are not part of this match!',
            flags: 64
        });
    }

    // Update last activity
    match.lastActivity = Date.now();

    // Clear any existing turn timer
    if (match.turnTimeouts && match.turnTimeouts.has(userId)) {
        clearTimeout(match.turnTimeouts.get(userId));
        match.turnTimeouts.delete(userId);
    }

    // Handle different actions
    switch (action) {
        case 'attack':
            await handleAttackAction(interaction, match, userId, matchId);
            break;
        case 'defend':
            await handleDefendAction(interaction, match, userId, matchId);
            break;
        case 'special':
            await handleSpecialAction(interaction, match, userId, matchId);
            break;
        case 'forfeit':
            await handleForfeitAction(interaction, match, userId, matchId);
            break;
        case 'stats':
            await handleStatsAction(interaction, match, userId, matchId);
            break;
        default:
            await interaction.reply({
                content: '❌ Unknown action.',
                flags: 64
            });
    }
}

async function handleAttackAction(interaction, match, userId, matchId) {
    const attacker = match.player1.id === userId ? match.player1 : match.player2;
    const defender = match.player1.id === userId ? match.player2 : match.player1;

    // Calculate damage based on CP difference and randomness
    const cpRatio = attacker.cp / defender.cp;
    const baseDamage = 20 + Math.random() * 20; // 20-40 base damage
    const cpModifier = Math.max(0.5, Math.min(2.0, cpRatio)); // Limit modifier between 0.5x and 2.0x
    const finalDamage = Math.floor(baseDamage * cpModifier);

    // Check if defender is defending (reduce damage by 50%)
    const isDefending = defender.effects && defender.effects.includes('defending');
    const actualDamage = isDefending ? Math.floor(finalDamage * 0.5) : finalDamage;

    // Apply damage
    defender.hp = Math.max(0, defender.hp - actualDamage);

    // Clear defender's effects
    if (defender.effects) {
        defender.effects = defender.effects.filter(effect => effect !== 'defending');
    }

    // Create action description
    let actionText = `**${attacker.user.displayName}** unleashes a powerful attack on **${defender.user.displayName}**!`;
    if (isDefending) {
        actionText += `\n🛡️ **${defender.user.displayName}** was defending - damage reduced!`;
    }

    const actionEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Attack!')
        .setDescription(actionText)
        .addFields(
            { 
                name: '🗡️ Attacker', 
                value: `**${attacker.user.displayName}**\n❤️ HP: ${attacker.hp}/${attacker.maxHp}\n💫 Energy: ${attacker.energy}/3`, 
                inline: true 
            },
            { 
                name: '💥', 
                value: `**${actualDamage} DMG**\n${isDefending ? '🛡️ Blocked 50%' : '🎯 Direct Hit'}`, 
                inline: true 
            },
            { 
                name: '🎯 Target', 
                value: `**${defender.user.displayName}**\n❤️ HP: ${defender.hp}/${defender.maxHp}\n💫 Energy: ${defender.energy}/3`, 
                inline: true 
            }
        );

    // Check for battle end
    if (defender.hp <= 0) {
        await endBattle(interaction, match, attacker.id, matchId, 'knockout');
        return;
    }

    // Switch turns and increment round
    match.currentTurn = defender.id;
    match.round++;

    // Regenerate energy (1 per turn, max 3)
    if (attacker.energy < 3) attacker.energy++;
    if (defender.energy < 3) defender.energy++;

    await updateBattleMessage(interaction, match, matchId, actionEmbed);
}

async function handleDefendAction(interaction, match, userId, matchId) {
    const defender = match.player1.id === userId ? match.player1 : match.player2;
    const opponent = match.player1.id === userId ? match.player2 : match.player1;

    // Add defending effect
    if (!defender.effects) defender.effects = [];
    defender.effects.push('defending');

    // Restore some HP (5-10 points)
    const healAmount = Math.floor(5 + Math.random() * 6);
    defender.hp = Math.min(defender.maxHp, defender.hp + healAmount);

    const actionEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🛡️ Defend!')
        .setDescription(`**${defender.user.displayName}** takes a defensive stance and recovers some health!`)
        .addFields(
            { 
                name: '🛡️ Defender', 
                value: `**${defender.user.displayName}**\n❤️ HP: ${defender.hp}/${defender.maxHp} (+${healAmount})\n💫 Energy: ${defender.energy}/3\n🔄 Status: Defending`, 
                inline: true 
            },
            { 
                name: '⚡', 
                value: `**Effect**\nNext attack\ndamage -50%\n\n**Healing**\n+${healAmount} HP`, 
                inline: true 
            },
            { 
                name: '⚔️ Opponent', 
                value: `**${opponent.user.displayName}**\n❤️ HP: ${opponent.hp}/${opponent.maxHp}\n💫 Energy: ${opponent.energy}/3`, 
                inline: true 
            }
        );

    // Switch turns and increment round
    match.currentTurn = opponent.id;
    match.round++;

    // Regenerate energy
    if (defender.energy < 3) defender.energy++;
    if (opponent.energy < 3) opponent.energy++;

    await updateBattleMessage(interaction, match, matchId, actionEmbed);
}

async function handleSpecialAction(interaction, match, userId, matchId) {
    const attacker = match.player1.id === userId ? match.player1 : match.player2;
    const defender = match.player1.id === userId ? match.player2 : match.player1;

    // Check energy requirement
    if (attacker.energy < 1) {
        return await interaction.reply({
            content: '❌ You need at least 1 energy to use a special move!',
            flags: 64
        });
    }

    // Consume energy
    attacker.energy -= 1;

    // Calculate special damage (higher than normal attack)
    const cpRatio = attacker.cp / defender.cp;
    const baseDamage = 35 + Math.random() * 25; // 35-60 base damage
    const cpModifier = Math.max(0.6, Math.min(2.5, cpRatio));
    const specialDamage = Math.floor(baseDamage * cpModifier);

    // Special moves ignore defense but do slightly less damage if defending
    const isDefending = defender.effects && defender.effects.includes('defending');
    const actualDamage = isDefending ? Math.floor(specialDamage * 0.8) : specialDamage;

    // Apply damage
    defender.hp = Math.max(0, defender.hp - actualDamage);

    // Clear defender's effects
    if (defender.effects) {
        defender.effects = defender.effects.filter(effect => effect !== 'defending');
    }

    const actionEmbed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('💥 Special Move!')
        .setDescription(`**${attacker.user.displayName}** channels their Devil Fruit power and unleashes a devastating special attack!`)
        .addFields(
            { 
                name: '🌟 Attacker', 
                value: `**${attacker.user.displayName}**\n❤️ HP: ${attacker.hp}/${attacker.maxHp}\n💫 Energy: ${attacker.energy}/3 (-1)`, 
                inline: true 
            },
            { 
                name: '💥', 
                value: `**${actualDamage} DMG**\n🌟 Special Attack!\n${isDefending ? '🛡️ Partially Blocked' : '🎯 Critical Hit'}`, 
                inline: true 
            },
            { 
                name: '🎯 Target', 
                value: `**${defender.user.displayName}**\n❤️ HP: ${defender.hp}/${defender.maxHp}\n💫 Energy: ${defender.energy}/3`, 
                inline: true 
            }
        );

    // Check for battle end
    if (defender.hp <= 0) {
        await endBattle(interaction, match, attacker.id, matchId, 'special_ko');
        return;
    }

    // Switch turns and increment round
    match.currentTurn = defender.id;
    match.round++;

    // Regenerate energy for defender only (attacker used energy)
    if (defender.energy < 3) defender.energy++;

    await updateBattleMessage(interaction, match, matchId, actionEmbed);
}

async function handleForfeitAction(interaction, match, userId, matchId) {
    const forfeiter = match.player1.id === userId ? match.player1 : match.player2;
    const winner = match.player1.id === userId ? match.player2 : match.player1;

    await endBattle(interaction, match, winner.id, matchId, 'forfeit', forfeiter.id);
}

async function handleStatsAction(interaction, match, userId, matchId) {
    const player1 = match.player1;
    const player2 = match.player2;
    const currentPlayer = match.currentTurn === player1.id ? player1 : player2;

    const statsEmbed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('📊 Battle Statistics')
        .setDescription(`**Round ${match.round}** | Current Turn: **${currentPlayer.user.displayName}**`)
        .addFields(
            { 
                name: `🥊 ${player1.user.displayName}`, 
                value: `❤️ HP: ${player1.hp}/${player1.maxHp} (${Math.round(player1.hp/player1.maxHp*100)}%)\n💫 Energy: ${player1.energy}/3\n⚡ CP: ${player1.cp.toLocaleString()}\n🔄 Effects: ${player1.effects?.length ? player1.effects.join(', ') : 'None'}`, 
                inline: true 
            },
            { 
                name: '⚔️', 
                value: `**Battle Info**\n\nDuration: ${Math.floor((Date.now() - match.startTime) / 1000)}s\nRounds: ${match.round}\nStatus: Active`, 
                inline: true 
            },
            { 
                name: `🥊 ${player2.user.displayName}`, 
                value: `❤️ HP: ${player2.hp}/${player2.maxHp} (${Math.round(player2.hp/player2.maxHp*100)}%)\n💫 Energy: ${player2.energy}/3\n⚡ CP: ${player2.cp.toLocaleString()}\n🔄 Effects: ${player2.effects?.length ? player2.effects.join(', ') : 'None'}`, 
                inline: true 
            }
        )
        .setFooter({ text: `Match ID: ${matchId}` })
        .setTimestamp();

    await interaction.reply({
        embeds: [statsEmbed],
        flags: 64
    });
}

async function updateBattleMessage(interaction, match, matchId, actionEmbed) {
    const battleEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Battle in Progress')
        .setDescription(`**${match.player1.user.displayName}** vs **${match.player2.user.displayName}**`)
        .addFields(
            { 
                name: '🥊 Fighter 1', 
                value: `**${match.player1.user.displayName}**\n❤️ HP: ${match.player1.hp}/${match.player1.maxHp}\n💫 Energy: ${match.player1.energy}/3\n${match.player1.effects?.includes('defending') ? '🛡️ Defending' : ''}`, 
                inline: true 
            },
            { 
                name: '⚡', 
                value: `**Round ${match.round}**\n\n**Current Turn:**\n<@${match.currentTurn}>\n\n⏰ 45 seconds`, 
                inline: true 
            },
            { 
                name: '🥊 Fighter 2', 
                value: `**${match.player2.user.displayName}**\n❤️ HP: ${match.player2.hp}/${match.player2.maxHp}\n💫 Energy: ${match.player2.energy}/3\n${match.player2.effects?.includes('defending') ? '🛡️ Defending' : ''}`, 
                inline: true 
            }
        )
        .setFooter({ text: `Match ID: ${matchId}` })
        .setTimestamp();

    const battleActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`pvp_action_attack_${matchId}`)
                .setLabel('Attack')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚔️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_defend_${matchId}`)
                .setLabel('Defend')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🛡️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_special_${matchId}`)
                .setLabel('Special Move')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💥')
                .setDisabled((match.currentTurn === match.player1.id ? match.player1.energy : match.player2.energy) < 1)
        );

    const utilityActions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`pvp_action_forfeit_${matchId}`)
                .setLabel('Forfeit')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🏳️'),
            new ButtonBuilder()
                .setCustomId(`pvp_action_stats_${matchId}`)
                .setLabel('Battle Stats')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📊')
        );

    await interaction.update({
        content: `🎮 **BATTLE ACTIVE** | <@${match.currentTurn}> **YOUR TURN!**`,
        embeds: [actionEmbed, battleEmbed],
        components: [battleActions, utilityActions]
    });

    // Start new turn timer
    startTurnTimer(matchId, match.currentTurn, 45000);
}

async function endBattle(interaction, match, winnerId, matchId, endType = 'knockout', forfeiterId = null) {
    const winner = match.player1.id === winnerId ? match.player1 : match.player2;
    const loser = match.player1.id === winnerId ? match.player2 : match.player1;
    
    let title, description, color;
    
    switch (endType) {
        case 'forfeit':
            title = '🏳️ Victory by Forfeit!';
            description = `**${winner.user.displayName}** wins as **${loser.user.displayName}** forfeited the match!`;
            color = '#f39c12';
            break;
        case 'special_ko':
            title = '💥 Special KO!';
            description = `**${winner.user.displayName}** delivers a devastating special move for victory!`;
            color = '#9b59b6';
            break;
        case 'timeout':
            title = '⏰ Victory by Timeout!';
            description = `**${winner.user.displayName}** wins as their opponent took too long to act!`;
            color = '#95a5a6';
            break;
        default:
            title = '🎉 Victory!';
            description = `**${winner.user.displayName}** emerges victorious in an epic battle!`;
            color = '#f1c40f';
    }

    const battleDuration = Math.floor((Date.now() - match.startTime) / 1000);
    const minutes = Math.floor(battleDuration / 60);
    const seconds = battleDuration % 60;
    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const victoryEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields(
            { 
                name: '🏆 Winner', 
                value: `**${winner.user.displayName}**\n⚡ CP: ${winner.cp.toLocaleString()}\n❤️ Final HP: ${winner.hp}/${winner.maxHp}\n💫 Energy: ${winner.energy}/3`, 
                inline: true 
            },
            { 
                name: '📊', 
                value: `**Battle Stats**\n\nDuration: ${durationStr}\nRounds: ${match.round}\nType: ${endType.replace('_', ' ').toUpperCase()}`, 
                inline: true 
            },
            { 
                name: '💔 Defeated', 
                value: `**${loser.user.displayName}**\n⚡ CP: ${loser.cp.toLocaleString()}\n❤️ Final HP: ${loser.hp}/${loser.maxHp}\n💫 Energy: ${loser.energy}/3`, 
                inline: true 
            },
            {
                name: '🎯 Battle Summary',
                value: `An intense ${match.round}-round battle between two skilled pirates! ${winner.user.displayName} proved their Devil Fruit mastery today.`,
                inline: false
            }
        )
        .setTimestamp();

    // Remove match from active matches
    queueManager.removeMatch(matchId);

    // Add cooldown to both players (3 minutes)
    queueManager.addPlayerCooldown(winner.id, 3);
    queueManager.addPlayerCooldown(loser.id, 3);

    // TODO: Update player stats, give rewards, update leaderboards
    // This would integrate with your database to:
    // - Update win/loss records
    // - Give berries/rewards to winner
    // - Update PvP rankings
    // - Log battle history

    try {
        await interaction.update({
            content: `🎊 **BATTLE COMPLETE!** 🎊`,
            embeds: [victoryEmbed],
            components: []
        });
    } catch (error) {
        console.error('Error ending battle:', error);
        await interaction.followUp({
            embeds: [victoryEmbed]
        });
    }
}

function startTurnTimer(matchId, playerId, duration) {
    const activeMatches = queueManager.getActiveMatches();
    const match = activeMatches.get(matchId);
    
    if (!match || !match.turnTimeouts) {
        match.turnTimeouts = new Map();
    }

    // Clear any existing timeout for this player
    if (match.turnTimeouts.has(playerId)) {
        clearTimeout(match.turnTimeouts.get(playerId));
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
        await handleTurnTimeout(matchId, playerId);
    }, duration);

    match.turnTimeouts.set(playerId, timeoutId);
}

async function handleTurnTimeout(matchId, playerId) {
    const activeMatches = queueManager.getActiveMatches();
    const match = activeMatches.get(matchId);

    if (!match || match.currentTurn !== playerId || match.status !== 'active') {
        return; // Turn already changed or match ended
    }

    const timeoutPlayer = match.player1.id === playerId ? match.player1 : match.player2;
    const winner = match.player1.id === playerId ? match.player2 : match.player1;

    // Create a mock interaction for ending the battle
    const mockInteraction = {
        update: async (data) => {
            console.log(`Player ${timeoutPlayer.user.displayName} timed out in match ${matchId}`);
        }
    };

    await endBattle(mockInteraction, match, winner.id, matchId, 'timeout');
}

function getQueuePosition(userId) {
    const queue = queueManager.getQueue();
    const queueArray = Array.from(queue.entries()).sort((a, b) => a[1].joinTime - b[1].joinTime);
    const position = queueArray.findIndex(([id]) => id === userId) + 1;
    return position > 0 ? `#${position}` : 'Not found';
}

function getCurrentMatchRange(cp, waitTime) {
    let tolerance = 0.3; // Start with ±30%
    
    if (waitTime > 30000) tolerance = 0.5; // ±50% after 30s
    if (waitTime > 60000) tolerance = 0.7; // ±70% after 1m
    if (waitTime > 120000) tolerance = 1.0; // ±100% after 2m

    const minCP = Math.floor(cp * (1 - tolerance));
    const maxCP = Math.floor(cp * (1 + tolerance));
    
    return `${minCP.toLocaleString()} - ${maxCP.toLocaleString()} CP`;
}
