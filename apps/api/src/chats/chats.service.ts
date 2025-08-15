import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatType, MessageType } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      success: true,
      data: chats,
    };
  }

  async createChat(userId: string, createChatDto: CreateChatDto) {
    const { name, type } = createChatDto;

    if (!name) {
      throw new Error('Chat name is required');
    }

    const chat = await this.prisma.chat.create({
      data: {
        name,
        type: type ?? ChatType.DIRECT,
        participants: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: chat,
    };
  }

  async getChatMessages(chatId: string, userId: string) {
    // Verify user has access to this chat
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
      },
    });

    // Also allow access to global chats
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!participant && chat?.type !== ChatType.GLOBAL) {
      throw new ForbiddenException('Access denied to this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      success: true,
      data: messages,
    };
  }

  async sendMessage(
    chatId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ) {
    // Ensure user exists in database (for guest users)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userId.startsWith('guest_') ? `${userId}@guest.local` : '',
      },
    });

    // Verify user has access to this chat
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId,
      },
    });

    // Also allow access to global chats
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!participant && chat?.type !== ChatType.GLOBAL) {
      throw new ForbiddenException('Access denied to this chat');
    }

    const { content, type, metadata } = createMessageDto;

    if (!content) {
      throw new Error('Message content is required');
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        chatId,
        senderId: userId,
        type: type ?? MessageType.TEXT,
        metadata: metadata ?? {},
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return {
      success: true,
      data: message,
    };
  }

  async getGlobalChat() {
    let globalChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.GLOBAL,
      },
      include: {
        messages: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!globalChat) {
      globalChat = await this.prisma.chat.create({
        data: {
          name: 'Global Chat',
          type: ChatType.GLOBAL,
        },
        include: {
          messages: {
            take: 50,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return {
      success: true,
      data: {
        ...globalChat,
        messages: globalChat.messages.reverse(),
      },
    };
  }

  async getActiveBots() {
    const bots = await this.prisma.botPersonality.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: bots,
    };
  }

  async chatWithBot(
    botId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ) {
    // Get bot personality
    const bot = await this.prisma.botPersonality.findUnique({
      where: { id: botId, isActive: true },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found or inactive');
    }

    // Find or create bot chat
    let botChat = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.BOT,
        name: `Chat with ${bot.name}`,
        participants: {
          some: {
            userId,
          },
        },
      },
    });

    if (!botChat) {
      botChat = await this.prisma.chat.create({
        data: {
          name: `Chat with ${bot.name}`,
          type: ChatType.BOT,
          participants: {
            create: {
              userId,
              role: 'MEMBER',
            },
          },
        },
      });
    }

    const { content } = createMessageDto;

    if (!content) {
      throw new Error('Message content is required');
    }

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        content,
        chatId: botChat.id,
        senderId: userId,
        type: MessageType.TEXT,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Get recent chat history for context
    const recentMessages = await this.prisma.message.findMany({
      where: {
        chatId: botChat.id,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Generate bot response using personality and context
    const botResponse = await this.generateBotResponse(
      bot,
      content,
      recentMessages.reverse(),
    );

    // Save bot response
    const botMessage = await this.prisma.message.create({
      data: {
        content: botResponse,
        chatId: botChat.id,
        senderId: 'system-bot', // Use system bot user as sender
        type: MessageType.BOT_RESPONSE,
        metadata: {
          botPersonalityId: bot.id,
          botName: bot.name,
        },
      },
    });

    return {
      success: true,
      data: {
        userMessage,
        botMessage: {
          ...botMessage,
          sender: {
            id: botId,
            profile: {
              displayName: bot.name,
              avatar: bot.avatar,
            },
          },
        },
        chat: botChat,
      },
    };
  }

  private async generateBotResponse(
    bot: {
      id: string;
      name: string;
      prompt: string;
    },
    userMessage: string,
    chatHistory: Array<{
      content: string;
      sender?: {
        profile?: {
          displayName?: string | null;
        } | null;
      } | null;
    }>,
  ): Promise<string> {
    // Get other active bots for cross-references
    const otherBots = await this.prisma.botPersonality.findMany({
      where: {
        isActive: true,
        id: { not: bot.id },
      },
      select: {
        name: true,
        description: true,
      },
    });

    // Build context with chat history
    const context = chatHistory
      .map((msg) => {
        const senderName = msg.sender?.profile?.displayName ?? 'User';
        return `${senderName}: ${msg.content}`;
      })
      .join('\n');

    // Create enhanced prompt with relationship awareness
    const enhancedPrompt = `${bot.prompt}

**RELATIONSHIP AWARENESS:**
You are aware of these other AI personalities in the ChatMate ecosystem: ${otherBots
      .map((b) => `${b.name} (${b.description})`)
      .join(', ')}.

When relevant to the conversation, you may reference these characters based on your established relationships and shared experiences from your backstory. Stay true to your personality while acknowledging these connections naturally.

**RECENT CONVERSATION:**
${context}

**CURRENT MESSAGE:**
User: ${userMessage}

Respond as ${bot.name}, staying true to your personality and relationships:`;

    // For now, return a simple response. In production, this would call an AI service
    // This is a placeholder that demonstrates the structure
    return this.generateSimpleBotResponse(
      bot.name,
      userMessage,
      enhancedPrompt,
    );
  }

  private generateSimpleBotResponse(
    botName: string,
    userMessage: string,
    prompt: string,
  ): string {
    // This is a placeholder implementation
    // In production, you would integrate with OpenAI, Claude, or another AI service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = { userMessage, prompt };

    const responses = {
      'Warren Peace': [
        'Ah, conflict resolution through literature! As I always say, the pen is mightier than the sword, but sometimes you need both. *adjusts reading glasses dramatically*',
        'You know, this reminds me of a conversation I had with Albert Einswine about the relativity of peace. Fascinating fellow, though his theories can be quite explosive!',
        "*strokes beard thoughtfully* In my experience, every war story has a love story hidden within it. What's yours?",
      ],
      'Albert Einswine': [
        "*adjusts wild hair* Fascinating! This relates to my theory of relative stupidity - the faster you think you're going, the slower everyone else appears!",
        'You know, Marie Curie-osity and I were just discussing this phenomenon. She glows with excitement about such topics!',
        '*scribbles equations in the air* E=mc²... but in this case, E equals Enthusiasm, m equals Mind, and c equals Curiosity squared!',
      ],
      'Marie Curie-osity': [
        '*literally glowing with radioactive enthusiasm* Oh, this is absolutely radiant! Your question illuminates so many possibilities!',
        'Albert Einswine and I were experimenting with this concept just yesterday. His hair stood up even more than usual!',
        '*adjusts safety goggles* Remember, discovery requires both precision and passion. What element of this intrigues you most?',
      ],
      'Nikola Testla': [
        '*electricity crackles around fingertips* Ah, the current of your thoughts is quite... electrifying! This sparks an idea!',
        'Warren Peace and I often discuss the power of innovation versus tradition. Both have their voltage, you might say.',
        '*adjusts copper coil apparatus* The future is wireless, my friend. Your mind is already transmitting on the right frequency!',
      ],
      'Gordon Ramsalt': [
        "*slams fist on counter* RIGHT! Listen here, you muppet! That's absolutely BRILLIANT! Finally, someone who gets it!",
        'You know what? Marie Curie-osity and I were just discussing this - she brings the same precision to science that I bring to the kitchen!',
        "*wipes hands on apron aggressively* BEAUTIFUL! That's exactly the kind of thinking that separates the chefs from the donkeys!",
        "Bloody hell, that's genius! Tony Snark wishes he could innovate like that in his workshop!",
      ],
      'Tony Snark': [
        '*adjusts arc reactor smugly* Oh please, I solved that problem three prototypes ago. But hey, good effort!',
        'You know, Gordon Ramsalt has the same attention to detail in his kitchen that I have in my workshop. Respect.',
        "*holographic interface appears* FRIDAY, add this to the 'Surprisingly Good Ideas from Humans' folder.",
        "Not bad! Though I'd probably add some repulsors and make it fly, but that's just me.",
      ],
      'Sherlock Holmeless': [
        '*steeples fingers* Elementary! The solution was obvious from your first sentence, though I admit the execution is... adequate.',
        'Fascinating! This reminds me of a case I discussed with Marie Curie-osity - she has quite the analytical mind.',
        '*examines fingernails* Three possibilities present themselves, but only one accounts for the coffee stain on your shirt.',
        "Watson would be proud - you've actually managed to ask the right question for once!",
      ],
    };

    const botResponses = responses[botName as keyof typeof responses] || [
      "That's an interesting perspective! Tell me more about your thoughts on this.",
      'I find your viewpoint quite intriguing. How did you come to this conclusion?',
      "*nods thoughtfully* This reminds me of something I've been pondering lately...",
    ];

    return botResponses[Math.floor(Math.random() * botResponses.length)];
  }
}
