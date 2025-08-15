<p align="center">
  <img src="https://img.shields.io/badge/ChatMate-v1.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg" alt="Node Version" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg" alt="PNPM Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.3-blue.svg" alt="TypeScript" />
</p>

# ChatMate 🤖💬

**ChatMate** is a comprehensive chat application featuring AI bots with fun personalities, sandbox global chat, and message summarization and translation capabilities.

## 🚀 Features

- **AI Chat Bots**: Interactive bots with unique personalities
- **Global Chat**: Sandbox environment for real-time messaging
- **Message Intelligence**: Summarization and translation capabilities
- **Cross-Platform**: Web, iOS, and Android support
- **Real-time Sync**: Powered by Supabase realtime
- **Offline Support**: React Query caching for offline functionality

## 🏗️ Architecture

**ChatMate** is built as a modern monorepo using pnpm workspaces:

```
chat-mate/
├── apps/
│   ├── api/          # NestJS backend API
│   └── app/          # Expo React Native app
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── utils/        # Shared utility functions
└── ...
```

### Tech Stack

**Backend (API)**

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with JWT
- **Logging**: nestjs-pino/winston
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Class-validator, Zod

**Frontend (App)**

- **Framework**: Expo React Native with TypeScript
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Styling**: NativeWind (Tailwind CSS)
- **Internationalization**: React Intl
- **Animations**: React Native Reanimated

**Shared Packages**

- **Types**: Centralized TypeScript definitions
- **Utils**: Reusable utility functions

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: For database
- **Supabase Account**: For authentication and real-time features

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chat-mate
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   **API Environment**:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Edit `apps/api/.env` with your configuration:
   - Database connection string
   - Supabase URL and keys
   - JWT secrets

   **App Environment**:

   ```bash
   cp apps/app/.env.example apps/app/.env
   ```

   Edit `apps/app/.env` with your configuration:
   - API base URL
   - Supabase configuration

4. **Database Setup**

   ```bash
   # Generate Prisma client
   pnpm --filter @chat-mate/api run db:generate

   # Run database migrations
   pnpm --filter @chat-mate/api run db:migrate

   # Seed database (optional)
   pnpm --filter @chat-mate/api run db:seed
   ```

## 🚀 Usage

### Development

**Start all services**:

```bash
pnpm dev
```

**Start individual services**:

```bash
# API only
pnpm dev:api

# App only
pnpm dev:app
```

**Available URLs**:

- **API**: http://localhost:3000
- **App (Web)**: http://localhost:8081
- **App (Mobile)**: Use Expo Go app with QR code

### Production Build

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm build:api
pnpm build:app
```

### Testing

```bash
# Run all tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

### Database Management

```bash
# Open Prisma Studio
pnpm --filter @chat-mate/api run db:studio

# Reset database
pnpm --filter @chat-mate/api run db:reset

# Deploy migrations
pnpm --filter @chat-mate/api run db:deploy
```

## 📱 Platform Support

- **Web**: Full responsive web application
- **iOS**: Native iOS app via Expo
- **Android**: Native Android app via Expo

## 🔒 Security

- **Supabase RLS**: Row Level Security enabled
- **Environment Variables**: Secure configuration management
- **JWT**: Token-based authentication with expiry/refresh
- **CORS**: Strict cross-origin resource sharing
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API endpoint protection

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes following the coding standards**:
   - Follow SRP, DRY, KISS, YAGNI principles
   - Pure functions < 50 LOC
   - Components < 200 LOC
   - Max 3 levels of nesting
   - Use conventional commit messages
4. **Run tests and linting**
   ```bash
   pnpm lint
   pnpm test
   pnpm type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to your branch**
   ```bash
   git push origin feat/your-feature-name
   ```
7. **Create a Pull Request**

### Coding Standards

- **Naming Conventions**:
  - PascalCase for components/classes
  - camelCase for variables/functions
  - SCREAMING_CASE for constants/enums
- **Function Naming**: verbNoun pattern
- **TypeScript**: 100% typed, no `any` or implicit types
- **Comments**: Document non-obvious code and public APIs
- **Imports**: Avoid circular dependencies

### Branch Naming

- `feat/<feature-name>`: New features
- `fix/<bug-name>`: Bug fixes
- `chore/<task-name>`: Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide relevant logs and error messages

## 🙏 Acknowledgments

- **NestJS** - Progressive Node.js framework
- **Expo** - Universal React applications
- **Supabase** - Open source Firebase alternative
- **Prisma** - Next-generation ORM
- **React Query** - Data fetching library
- **Zustand** - State management solution

---

<p align="center">
  Made with ❤️ for the developer community
</p>
