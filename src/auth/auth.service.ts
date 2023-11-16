import * as bcrypt from 'bcrypt';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { handleDbError } from 'src/common/helpers/handle-db-error';
import { MailService } from 'src/mail/mail.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
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
    const user = this.userRepository.create({
      ...createUserDto,
      password: bcrypt.hashSync(createUserDto.password, 10),
    });

    try {
      await this.userRepository.insert(user);
      delete user.password;
      await this.mailService.sendRegistrationEmail({
        email: user.email,
        name: user.name,
        //Todo: expirar token en 1 hora
        token: this.jwtService.sign({ userId: user.id }),
      });
      return user;
    } catch (error) {
      handleDbError(error);
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      select: { password: true },
      where: { email: loginUserDto.email },
    });

    if (!user.verified)
      throw new UnauthorizedException(`Usuario no verificado`);

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

  async verify({ token }: VerifyUserDto) {
    try {
      const { userId }: JwtPayload = this.jwtService.verify(token);
      const user = await this.findOne(userId);

      user.verified = true;
      await this.userRepository.save(user);
      return 'Usuario verificado exitosamente. Ya puedes iniciar sesión';
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException(`Invalid token`);
    }
  }
}
