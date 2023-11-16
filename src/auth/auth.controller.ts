import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { VerifyUserDto } from './dto/verify-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get('verify')
  verify(@Query() verifyUserDto: VerifyUserDto) {
    return this.authService.verify(verifyUserDto);
  }
}
