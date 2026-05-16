import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getUserChats(@Req() req: any) {
    const userId = req.user.id;
    return this.chatService.getUserChats(userId);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') chatId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.chatService.getChatMessages(chatId, userId);
  }

  @Post()
  async chat(
    @Req() req: any,
    @Body() body: { content: string; chatId?: string },
  ) {
    const userId = req.user.id;
    return this.chatService.sendMessage(userId, body.content, body.chatId);
  }

  @Patch(':id')
  async updateChatTitle(
    @Param('id') chatId: string,
    @Req() req: any,
    @Body() body: { title: string },
  ) {
    const userId = req.user.id;
    return this.chatService.updateChatTitle(chatId, userId, body.title);
  }

  @Delete(':id')
  async deleteChat(
    @Param('id') chatId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.chatService.deleteChat(chatId, userId);
  }
}
