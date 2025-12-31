import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getUserChats(@Query('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') chatId: string,
    @Query('userId') userId: string,
  ) {
    return this.chatService.getChatMessages(chatId, userId);
  }

  @Post()
  async chat(
    @Body() body: { userId: string; content: string; chatId?: string },
  ) {
    return this.chatService.sendMessage(body.userId, body.content, body.chatId);
  }

  @Patch(':id')
  async updateChatTitle(
    @Param('id') chatId: string,
    @Body() body: { userId: string; title: string },
  ) {
    return this.chatService.updateChatTitle(chatId, body.userId, body.title);
  }

  @Delete(':id')
  async deleteChat(
    @Param('id') chatId: string,
    @Query('userId') userId: string,
  ) {
    return this.chatService.deleteChat(chatId, userId);
  }
}
