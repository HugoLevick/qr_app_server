import * as bcrypt from 'bcrypt';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('AuthService');

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }

    return user;
  }

  async register(createUserDto: CreateUserDto) {
    console.log(createUserDto);
    const user = this.userRepository.create({
      ...createUserDto,
      password: bcrypt.hashSync(createUserDto.password, 10),
    });

    try {
      await this.userRepository.save(user);
      delete user.password;
      return user;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      select: { password: true },
      where: { email: loginUserDto.email },
    });

    console.log(user);
    if (!bcrypt.compareSync(loginUserDto.password, user.password)) {
      throw new NotFoundException(`Invalid login`);
    }

    delete user.password;
    const token = this.jwtService.sign({ userId: user.id });
    return {
      message: 'Logged in successfully',
      statusCode: 200,
      token,
    };
  }
}
