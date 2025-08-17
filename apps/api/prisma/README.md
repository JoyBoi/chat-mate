# Database Seeding

## Overview

This directory contains database seeding scripts for the ChatMate API.

## Files

- `seed.template.ts` - Template file showing the structure for bot personalities
- `seed.ts` - **NOT TRACKED BY GIT** - Contains actual proprietary character data

## Setup for Development

1. Copy the template file:
   ```bash
   cp seed.template.ts seed.ts
   ```

2. Replace the example bot personality with your actual character data:
   - Update the `personalities` array with real bot characters
   - Modify prompts, descriptions, and personality traits
   - Add avatar URLs and other metadata

3. Run the seed script:
   ```bash
   pnpm db:seed
   ```

## Important Notes

⚠️ **The `seed.ts` file is excluded from Git** to protect proprietary character data and prompts that represent competitive intellectual property.

- Never commit `seed.ts` to version control
- Always use `seed.template.ts` as the reference for structure
- Keep sensitive character prompts and personalities in `seed.ts` only

## Bot Personality Structure

Each bot personality should follow this structure:

```typescript
{
  name: string;           // Display name of the bot
  description: string;    // Brief description for users
  prompt: string;         // System prompt defining personality
  avatar?: string;        // Avatar image URL
  category?: string;      // Bot category (optional)
  isActive: boolean;      // Whether bot is available
  isFeatured: boolean;    // Whether to feature prominently
}
```

## Categories

Recommended bot categories:
- `ENTERTAINMENT`
- `EDUCATIONAL` 
- `PRODUCTIVITY`
- `CREATIVE`
- `TECHNICAL`
- `HISTORICAL`
- `COMEDY`