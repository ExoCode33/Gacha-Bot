// src/commands/info.js - Updated Info Command with Dynamic Variables
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFruitById, RARITY_RATES, ELEMENT_COUNTERS } = require('../data/devil-fruits');
const DatabaseManager = require('../database/manager');
const EconomySystem = require('../systems/economy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('ℹ️ Get information about the game mechanics!')
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('What would you like to know about?')
                .setRequired(false)
                .addChoices(
                    { name: 'Game Overview', value: 'overview' },
                    { name: 'Devil Fruits', value: 'fruits' },
                    { name: 'Rarity Rates', value: 'rates' },
                    { name: 'Level System', value: 'levels' },
                    { name: 'Economy', value: 'economy' },
                    { name: 'Elements', value: 'elements' },
                    { name: 'Commands', value: 'commands' }
                )
        ),

    async execute(interaction) {
        try {
            const topic = interaction.options.getString('topic') || 'overview';
            
            let embed;
            
            switch (topic) {
                case 'overview':
                    embed = await this.createOverviewEmbed();
                    break;
                case 'fruits':
                    embed = await this.createFruitsEmbed();
                    break;
                case 'rates':
                    embed = await this.createRatesEmbed();
                    break;
                case 'levels':
                    embed = await this.createLevelsEmbed();
                    break;
                case 'economy':
                    embed = await this.createEconomyEmbed();
                    break;
                case 'elements':
                    embed = await this.createElementsEmbed();
                    break;
                case 'commands':
                    embed = await this.createCommandsEmbed();
                    break;
                default:
                    embed = await this.createOverviewEmbed();
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in info command:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error')
                .setDescription('Something went wrong while loading the information!')
                .setFooter({ text: 'Please try again later.' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async createOverviewEmbed() {
        const stats = await DatabaseManager.getServerStats();
        const config = EconomySystem.getEconomyConfig();
        
        return new EmbedBuilder()
            .setColor(0x0080FF)
            .setTitle('🏴‍☠️ One Piece Devil Fruit Gacha Bot')
            .setDescription('Welcome to the Grand Line! Collect Devil Fruits, build your power, and become the Pirate King!')
            .addFields([
                { name: '🎯 Objective', value: 'Collect Devil Fruits
