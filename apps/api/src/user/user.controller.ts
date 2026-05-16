import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.userService.findOne(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }
}
