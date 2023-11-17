import { IsString } from 'class-validator';

export class SetNewPasswordDto {
  @IsString()
  token: string;

  @IsString()
  newPassword: string;
}
