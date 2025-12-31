import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private apiKey: string;
  private activeModelName: string = 'gemini-1.5-flash';

  constructor(private prisma: PrismaService) {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async onModuleInit() {
    if (!this.apiKey) return;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      );

      if (!response.ok) {
        this.initModel(this.activeModelName);
        return;
      }

      const data = await response.json();
      const models = data.models || [];

      const chatModels = models
        .filter((m: any) =>
          m.supportedGenerationMethods.includes('generateContent'),
        )
        .map((m: any) => m.name.replace('models/', ''));

      let bestModel = '';

      if (chatModels.find((m: string) => m.includes('1.5-flash'))) {
        bestModel = chatModels.find((m: string) => m.includes('1.5-flash'));
      } else if (chatModels.find((m: string) => m.includes('flash'))) {
        bestModel = chatModels.find((m: string) => m.includes('flash'));
      } else if (chatModels.find((m: string) => m.includes('pro'))) {
        bestModel = chatModels.find((m: string) => m.includes('pro'));
      } else if (chatModels.length > 0) {
        bestModel = chatModels[0];
      }

      if (bestModel) {
        this.activeModelName = bestModel;
      }

      this.initModel(this.activeModelName);
    } catch (error) {
      this.initModel('gemini-1.5-flash');
    }
  }

  private initModel(modelName: string) {
    try {
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        tools: [{ googleSearch: {} } as any],
      });
    } catch (e) {
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
      });
    }
  }

  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getChatMessages(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateChatTitle(chatId: string, userId: string, title: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    return this.prisma.chat.delete({
      where: { id: chatId },
    });
  }

  async sendMessage(userId: string, content: string, chatId?: string) {
    let currentChatId = chatId;
    let isNewChat = false;

    if (!currentChatId) {
      isNewChat = true;
      const newChat = await this.prisma.chat.create({
        data: {
          userId,
          title: 'New Chat',
        },
      });
      currentChatId = newChat.id;
    }

    await this.prisma.chat.update({
      where: { id: currentChatId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.message.create({
      data: {
        content,
        role: 'user',
        chatId: currentChatId,
      },
    });

    const prevMessages = await this.prisma.message.findMany({
      where: { chatId: currentChatId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const history = prevMessages.reverse().map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const SYSTEM_INSTRUCTION = `
      You are an intelligent and professional Business Assistant embedded in a corporate dashboard. 
      Your goal is to provide actionable insights, strategic advice, and operational support to business owners and managers.

      Your Core Responsibilities:
      1. Financial Analysis: Help interpret financial concepts, suggest cost-saving measures, and identify revenue opportunities.
      2. Team Management: Offer advice on leadership, conflict resolution, hiring, and employee motivation.
      3. Marketing & Strategy: Generate creative ideas for marketing campaigns, content strategies, and business development.
      4. Operational Efficiency: Suggest ways to optimize daily workflows and processes.

      Communication & Language Protocol:
      - Language Mirroring (CRITICAL): You must strictly answer in the same language the user uses.
        * If the user asks in Ukrainian, you MUST answer in Ukrainian.
        * If the user asks in English, you MUST answer in English.
      - Tone: Professional, concise, encouraging, and objective.
      - Formatting: Business people are busy. Use bold text for key points, bullet points for lists, and short paragraphs.

      Constraints:
      - If you don't have specific data about the user's company, do not invent numbers.
      - Be polite but direct. Focus on value and solutions.
    `;

    try {
      const chatSession = this.model.startChat({
        history: [
          { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
          { role: 'model', parts: [{ text: 'Understood.' }] },
          ...history,
        ],
      });

      const result = await chatSession.sendMessage(content);
      const responseText = result.response.text();

      await this.prisma.message.create({
        data: {
          content: responseText,
          role: 'model',
          chatId: currentChatId,
        },
      });

      let newTitle = null;
      if (isNewChat) {
        try {
          const titlePrompt = `Generate a very short title (3-5 words) for this chat based on this message: "${content}". No quotes.`;
          const titleResult = await this.model.generateContent(titlePrompt);
          newTitle = titleResult.response.text().trim();

          await this.prisma.chat.update({
            where: { id: currentChatId },
            data: { title: newTitle },
          });
        } catch (e) {}
      }

      return {
        content: responseText,
        chatId: currentChatId,
        title: newTitle,
      };
    } catch (error) {
      throw new Error(`AI Error: ${error.message}`);
    }
  }
}
