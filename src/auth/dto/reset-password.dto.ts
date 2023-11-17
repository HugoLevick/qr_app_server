import { IsEmail, IsString, Length } from 'class-validator';

export class RequestPasswordEmailDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(4, 60)
  newPassword: string;

  @IsString()
  token: string;
}
