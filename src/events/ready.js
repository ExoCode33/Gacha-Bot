// src/events/ready.js - Ready Event Handler
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🏴‍☠️ ${client.user.tag} is ready to sail the Grand Line!`);
        console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
        console.log(`👥 Connected to ${client.users.cache.size} user(s)`);
        
        // Set bot presence
        try {
            client.user.setPresence({
                activities: [{ name: 'the Grand Line for Devil Fruits! 🍈', type: 0 }],
                status: 'online'
            });
            console.log('✅ Bot presence set successfully');
        } catch (error) {
            console.error('❌ Error setting bot presence:', error);
        }
        
        console.log('🎉 Ready event completed successfully!');
    }
};
