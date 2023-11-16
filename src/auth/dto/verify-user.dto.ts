import { IsString } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  token: string;
}
