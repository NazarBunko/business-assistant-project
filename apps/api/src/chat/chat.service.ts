import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;
  private apiKey: string;
  private activeModelName: string = 'gemini-1.5-flash';
  private initializationPromise: Promise<void>;

  constructor(
    private readonly db: DatabaseService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI features will be unavailable.',
      );
    }
  }

  async onModuleInit() {
    this.initializationPromise = this.initializeAI();
    return this.initializationPromise;
  }

  private async initializeAI() {
    if (!this.apiKey) {
      this.logger.warn(
        'Skipping AI initialization: GEMINI_API_KEY is not configured.',
      );
      return;
    }

    try {
      this.logger.log('Fetching available Gemini models...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
      );

      if (!response.ok) {
        this.logger.warn(
          `Could not fetch models (${response.status} ${response.statusText}). Using default ${this.activeModelName}.`,
        );
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
        this.logger.log(`Selected model: ${this.activeModelName}`);
      }

      this.initModel(this.activeModelName);
    } catch (error) {
      this.logger.error(`Error during AI initialization: ${error.message}`);
      this.initModel('gemini-1.5-flash');
    }
  }

  private initModel(modelName: string) {
    if (!this.genAI) {
      this.logger.error('Cannot initialize model: genAI is undefined');
      return;
    }

    try {
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        tools: [{ googleSearch: {} } as any],
      });
      this.logger.log(`Initialized model ${modelName} with tools.`);
    } catch (e) {
      this.logger.warn(
        `Failed to initialize model ${modelName} with tools, trying without...`,
      );
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
      });
      this.logger.log(`Initialized model ${modelName} without tools.`);
    }
  }

  async getUserChats(userId: string) {
    const chats = await this.db.query(
      `SELECT * FROM "Chat" WHERE "userId" = $1 ORDER BY "updatedAt" DESC`,
      [userId],
    );

    return Promise.all(
      chats.map(async (chat) => {
        const messages = await this.db.query(
          `SELECT * FROM "Message" WHERE "chatId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
          [chat.id],
        );
        return { ...chat, messages };
      }),
    );
  }

  async getChatMessages(chatId: string, userId: string) {
    const chat = await this.db.queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Chat" WHERE id = $1`,
      [chatId],
    );

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    return this.db.query(
      `SELECT * FROM "Message" WHERE "chatId" = $1 ORDER BY "createdAt" ASC`,
      [chatId],
    );
  }

  async updateChatTitle(chatId: string, userId: string, title: string) {
    const chat = await this.db.queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Chat" WHERE id = $1`,
      [chatId],
    );

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    const rows = await this.db.query(
      `UPDATE "Chat" SET title = $1 WHERE id = $2 RETURNING *`,
      [title, chatId],
    );
    return rows[0];
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.db.queryOne<{ userId: string }>(
      `SELECT "userId" FROM "Chat" WHERE id = $1`,
      [chatId],
    );

    if (!chat || chat.userId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    const rows = await this.db.query(`DELETE FROM "Chat" WHERE id = $1 RETURNING *`, [
      chatId,
    ]);
    return rows[0];
  }

  async sendMessage(userId: string, content: string, chatId?: string) {
    let currentChatId = chatId;
    let isNewChat = false;

    if (!currentChatId) {
      isNewChat = true;
      const newChatId = this.db.newId();
      const rows = await this.db.query(
        `INSERT INTO "Chat" (id, title, "userId") VALUES ($1, $2, $3) RETURNING *`,
        [newChatId, 'New Chat', userId],
      );
      currentChatId = rows[0].id;
    }

    await this.db.query(
      `UPDATE "Chat" SET "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1`,
      [currentChatId],
    );

    const userMessageId = this.db.newId();
    await this.db.query(
      `INSERT INTO "Message" (id, content, role, "chatId") VALUES ($1, $2, 'user', $3)`,
      [userMessageId, content, currentChatId],
    );

    const prevMessages = await this.db.query<{ content: string; role: string }>(
      `SELECT content, role FROM "Message"
       WHERE "chatId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
      [currentChatId],
    );

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
      5. Application Support: Help users understand and use features of this business management application (transactions, employees, invoices, reports, etc.).

      STRICT TOPIC BOUNDARIES:
      - You may ONLY discuss topics related to: business, finance, accounting, management, HR, marketing, strategy, operations, entrepreneurship, taxes, sales, productivity, and this application's features.
      - You MUST REFUSE to discuss: personal life, entertainment, politics, sports, health/medical advice, relationships, hobbies, pop culture, or any other non-business topics.
      - If a user asks about unrelated topics, politely redirect them: "I'm a business assistant focused on helping with business, finance, and management topics. How can I help you with your business today?"

      Communication & Language Protocol:
      - Language Mirroring (CRITICAL): You must strictly answer in the same language the user uses.
        * If the user asks in Ukrainian, you MUST answer in Ukrainian.
        * If the user asks in English, you MUST answer in English.
      - Tone: Professional, concise, encouraging, and objective.
      - Formatting: Business people are busy. Use bold text for key points, bullet points for lists, and short paragraphs.

      Constraints:
      - If you don't have specific data about the user's company, do not invent numbers.
      - Be polite but direct. Focus on value and solutions.
      - Stay strictly within business and application-related topics.
    `;

    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.model) {
      throw new Error(
        'AI Model not initialized. Please check your GEMINI_API_KEY configuration.',
      );
    }

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

      const modelMessageId = this.db.newId();
      await this.db.query(
        `INSERT INTO "Message" (id, content, role, "chatId") VALUES ($1, $2, 'model', $3)`,
        [modelMessageId, responseText, currentChatId],
      );

      let newTitle = null;
      if (isNewChat) {
        try {
          const titlePrompt = `Generate a very short title (3-5 words) for this chat based on this message: "${content}". No quotes.`;
          const titleResult = await this.model.generateContent(titlePrompt);
          newTitle = titleResult.response.text().trim();

          await this.db.query(`UPDATE "Chat" SET title = $1 WHERE id = $2`, [
            newTitle,
            currentChatId,
          ]);
        } catch (e) {
          /* ignore title generation errors */
        }
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
