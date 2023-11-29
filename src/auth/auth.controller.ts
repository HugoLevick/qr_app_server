import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import {
  RequestPasswordEmailDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { RolesEnum } from './enums/roles.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(RolesEnum.ADMIN)
  @Get('/user/:id')
  findOneById(@Param('id', ParseUUIDPipe) userId: string) {
    return this.authService.findOneBy({
      method: 'id',
      toFind: userId,
    });
  }

  @HttpCode(201)
  @Post('register')
  register(@Body() createAuthDto: CreateUserDto) {
    return this.authService.register(createAuthDto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Auth()
  @Get('validate')
  validateToken(@GetUser() user: User) {
    delete user.verified;
    return user;
  }

  @Get('verify')
  verifyUser(@Query() verifyUserDto: VerifyUserDto) {
    return this.authService.verifyEmail(verifyUserDto);
  }

  @Post('requestPasswordEmail')
  requestPasswordEmail(@Body() resetPasswordDto: RequestPasswordEmailDto) {
    return this.authService.requestPasswordEmail(resetPasswordDto);
  }

  @Post('resetPassword')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Auth(RolesEnum.ADMIN)
  @Delete('/user/:id')
  delete(@Param('id', ParseUUIDPipe) userId: string) {
    return this.authService.deleteOneById(userId);
  }

  @Auth(RolesEnum.ADMIN)
  @Get('access/logs')
  getAccessLogs() {
    return this.authService.getAccessLogs();
  }

  @Auth(RolesEnum.ADMIN)
  @Post('access/allow/:id')
  allowAccess(@Param('id', ParseUUIDPipe) userId: string) {
    return this.authService.allowAccess(userId);
  }
}
