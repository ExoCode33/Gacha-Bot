// src/events/guildMemberUpdate.js - Guild Member Update Event
const { Events } = require('discord.js');
const LevelSystem = require('../systems/levels');

module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        try {
            // Check if roles changed
            const oldRoles = oldMember.roles.cache.map(role => role.name);
            const newRoles = newMember.roles.cache.map(role => role.name);
            
            // Check if any level roles changed
            const levelRoles = LevelSystem.getLevelRoles();
            const oldLevelRoles = oldRoles.filter(role => levelRoles[role]);
            const newLevelRoles = newRoles.filter(role => levelRoles[role]);
            
            if (JSON.stringify(oldLevelRoles) !== JSON.stringify(newLevelRoles)) {
                await LevelSystem.updateUserLevel(
                    newMember.user.id, 
                    newMember.user.username, 
                    newMember.guild.id
                );
                console.log(`⭐ Level updated for ${newMember.user.username} due to role change`);
            }
            
        } catch (error) {
            console.error('Error in guildMemberUpdate event:', error);
        }
    }
};
