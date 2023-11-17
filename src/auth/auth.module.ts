import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { PasswordReset } from './entities/password-reset.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, PasswordReset]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
