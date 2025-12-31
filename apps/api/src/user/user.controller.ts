import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Query('userId') userId: string) {
    const user = await this.userService.findOne(userId);
    const { password, ...result } = user;
    return result;
  }

  @Patch('profile')
  async updateProfile(
    @Query('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.userService.updateProfile(userId, dto);
    const { password, ...result } = user;
    return result;
  }
}
