import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('support')
@UseGuards(AuthGuard('jwt'))
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('request')
  async createSupportRequest(
    @Req() req: any,
    @Body() dto: CreateSupportRequestDto,
  ) {
    const userId = req.user.id;
    await this.supportService.sendSupportRequest(userId, dto.message);
    return { success: true, message: 'Support request sent successfully' };
  }
}
