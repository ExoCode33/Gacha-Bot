# One Piece Devil Fruit Gacha Bot v3.0

A Discord bot where users can collect One Piece Devil Fruits through a gacha system with animated pulls, economy management, and role-based progression.

## Features

- 🍈 **150 Devil Fruits** across 7 rarity tiers
- 🎬 **Animated gacha pulls** with cinematic experience
- 💰 **Automated economy system** with CP-based income
- ⭐ **Role-based leveling** (Level-0 to Level-50)
- 🔄 **Duplicate system** with +1% CP per duplicate
- ⚡ **Element system** with 50+ elements
- 🏆 **Leaderboards** for CP, berries, and collection
- 📊 **Comprehensive stats** and collection management

## Setup Instructions

### Prerequisites

1. **Node.js** (version 16 or higher)
2. **PostgreSQL** database
3. **Discord Bot Token**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/one-piece-gacha-bot.git
   cd one-piece-gacha-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `DATABASE_URL`: PostgreSQL connection string

4. **Set up Discord roles**
   Create these roles in your Discord server:
   - Level-0, Level-5, Level-10, Level-15, Level-20
   - Level-25, Level-30, Level-35, Level-40, Level-45, Level-50

5. **Run the bot**
   ```bash
   npm start
   ```

### Database Setup

The bot automatically creates the required tables on first run:
- `users` - User data and CP information
- `user_devil_fruits` - Devil fruit collection
- `user_levels` - Level tracking
- `income_history` - Income tracking

## Commands

### Core Commands
- `/pull` - Pull a Devil Fruit (1,000 berries)
- `/income` - Collect your hourly berry income
- `/collection` - View your Devil Fruit collection
- `/stats` - View your pirate stats

### Social Commands
- `/leaderboard` - View server leaderboards
- `/info` - Get game information and help

## Game Mechanics

### Devil Fruit System
- **Rarity Distribution:**
  - 🟫 Common (40%): 1.0x - 1.5x CP
  - 🟩 Uncommon (30%): 1.5x - 2.5x CP
  - 🟦 Rare (20%): 2.5x - 4.0x CP
  - 🟪 Epic (7%): 4.0x - 6.0x CP
  - 🟨 Legendary (2.5%): 6.0x - 8.0x CP
  - 🟧 Mythical (0.4%): 8.0x - 10.0x CP
  - 🌈 Omnipotent (0.1%): 10.0x - 12.0x CP

### CP System
- **Base CP** determined by highest level role
- **Total CP** = Base CP × (Sum of all fruit multipliers)
- **Duplicates** provide +1% CP bonus per duplicate

### Economy System
- **Income Formula:** 50 base + (Total CP × 0.1) berries/hour
- **Automatic Income:** Generated every 10 minutes
- **Manual Collection:** Use `/income` (max 24 hours)

### Level System
- **Role-Based:** Level determined by Discord roles
- **CP Scaling:** Higher levels = higher base CP
- **Automatic Updates:** CP recalculated when roles change

## Element System

Each Devil Fruit has an element that affects strategic gameplay:
- Fire, Water, Ice, Lightning, Earth, Wind
- Light, Darkness, Gravity, Space, Time
- And 40+ more unique elements!

Elements have strategic advantages and will be important for future combat features.

## File Structure

```
one-piece-gacha-bot/
├── index.js                 # Main bot file
├── package.json             # Dependencies
├── .env.example            # Environment variables template
├── README.md               # This file
└── src/
    ├── commands/           # Slash commands
    │   ├── pull.js
    │   ├── income.js
    │   ├── collection.js
    │   ├── stats.js
    │   ├── leaderboard.js
    │   └── info.js
    ├── data/               # Game data
    │   └── devil-fruits.js
    ├── database/           # Database management
    │   └── manager.js
    ├── systems/            # Game systems
    │   ├── economy.js
    │   ├── levels.js
    │   └── auto-income.js
    └── events/             # Discord events
        ├── ready.js
        ├── interactionCreate.js
        └── guildMemberUpdate.js
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
- `NODE_ENV`: Set to `development` for development mode
- `DISCORD_TOKEN`: Your Discord bot token
- `DATABASE_URL`: PostgreSQL connection string

### Adding New Features
1. **New Commands:** Add to `src/commands/`
2. **New Systems:** Add to `src/systems/`
3. **New Events:** Add to `src/events/`
4. **Database Changes:** Update `src/database/manager.js`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env`
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Bot Not Responding**
   - Check bot token in `.env`
   - Verify bot permissions in Discord server
   - Check console for error messages

3. **Level System Not Working**
   - Ensure level roles exist in server
   - Check role names match exactly (Level-0, Level-5, etc.)
   - Verify bot can see member roles

4. **Commands Not Updating**
   - Restart the bot to register new commands
   - Check for syntax errors in command files

### Database Reset
If you need to reset the database:
```sql
DROP TABLE IF EXISTS income_history;
DROP TABLE IF EXISTS user_levels;
DROP TABLE IF EXISTS user_devil_fruits;
DROP TABLE IF EXISTS users;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Create an issue on GitHub with detailed information

---

**Happy sailing on the Grand Line! 🏴‍☠️**
