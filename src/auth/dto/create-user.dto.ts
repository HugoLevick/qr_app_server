import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(4)
  @MaxLength(60)
  name: string;

  @IsString()
  @MinLength(4)
  @MaxLength(60)
  password: string;

  @IsEmail()
  email: string;
}
