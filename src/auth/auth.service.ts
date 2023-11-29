import * as bcrypt from 'bcrypt';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Logger,
  BadRequestException,
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
import {
  AuthJwtPayload,
  PasswordResetJwtPayload,
} from './interfaces/jwt-payload.interface';
import {
  RequestPasswordEmailDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { PasswordReset } from './entities/password-reset.entity';
import { AccessLog } from './entities/access-log.entity';

interface UserFindOptions {
  method: 'email' | 'id';
  toFind: string;
  selectPassword?: boolean;
  selectVerified?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(AccessLog)
    private readonly accessLogRepository: Repository<AccessLog>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly logger = new Logger('AuthService');

  async findOneBy(selectOptions: UserFindOptions) {
    const {
      method,
      toFind,
      selectPassword = false,
      selectVerified = false,
    } = selectOptions;
    let selection = ['user'];
    if (selectPassword) selection.push('user.password');
    if (selectVerified) selection.push('user.verified');

    const query = this.userRepository
      .createQueryBuilder('user')
      .select(selection);

    switch (method) {
      case 'email':
        query.where('email=:email', { email: toFind });
        break;
      case 'id':
        query.where('id=:userId', { userId: toFind });
        break;
    }

    const user = await query.getOne();

    if (!user) {
      throw new NotFoundException(`User with identifier '${toFind}' not found`);
    }

    return user;
  }

  async register(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim();
    const name = createUserDto.name.trim();
    const lastName = createUserDto.lastName.trim();

    const user = this.userRepository.create({
      email,
      name,
      lastName,
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
    let user: User;
    try {
      user = await this.findOneBy({
        method: 'email',
        toFind: loginUserDto.email,
        selectPassword: true,
        selectVerified: true,
      });
    } catch (error) {
      throw new NotFoundException(`Credenciales incorrectas`);
    }

    if (!user.verified)
      throw new UnauthorizedException(`Usuario no verificado`);

    if (!bcrypt.compareSync(loginUserDto.password, user.password)) {
      throw new NotFoundException(`Credenciales incorrectas`);
    }

    delete user.password;
    const token = this.jwtService.sign({ userId: user.id });
    return {
      message: 'Logged in successfully',
      statusCode: 200,
      token,
    };
  }

  async verifyEmail({ token }: VerifyUserDto) {
    try {
      const { userId }: AuthJwtPayload = this.jwtService.verify(token);
      const user = await this.findOneBy({
        method: 'id',
        toFind: userId,
        selectPassword: true,
        selectVerified: true,
      });

      if (user.verified) return 'Usuario ya verificado';
      user.verified = true;
      await this.userRepository.save(user);
      return 'Usuario verificado exitosamente. Ya puedes iniciar sesión';
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException(`Invalid token`);
    }
  }

  async requestPasswordEmail(resetPasswordDto: RequestPasswordEmailDto) {
    const { email } = resetPasswordDto;
    const user = await this.userRepository.findOne({
      select: { id: true, name: true, verified: true },
      where: { email: resetPasswordDto.email },
    });

    if (user && user.verified) {
      const passwordReset = this.passwordResetRepository.create({
        user,
      });

      try {
        await this.passwordResetRepository.insert(passwordReset);
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
      this.mailService.sendForgotPasswordEmail({
        email: email,
        name: user.name,
        token: this.jwtService.sign(
          { resetId: passwordReset.id },
          { expiresIn: '1h' },
        ),
      });
    }

    return {
      message:
        'Si el correo está registrado, se envió un correo para reestablecer la contraseña',
      statusCode: 200,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { newPassword, token } = resetPasswordDto;
    let resetId: number;
    try {
      const payload: PasswordResetJwtPayload = this.jwtService.verify(token);
      resetId = payload.resetId;
    } catch (error) {
      throw new BadRequestException(`Invalid token`);
    }

    const passwordReset = await this.passwordResetRepository.findOne({
      where: { id: resetId },
      relations: { user: true },
    });

    if (!passwordReset)
      throw new BadRequestException(`Invalid token (reset id not found)`);

    if (passwordReset.used) throw new BadRequestException('Token ya utilizado');

    passwordReset.user.password = bcrypt.hashSync(newPassword, 10);

    try {
      await this.userRepository.save(passwordReset.user);
      passwordReset.used = true;
      await this.passwordResetRepository.save(passwordReset);
      return { message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'No se pudo cambiar la contraseña',
      );
    }
  }

  async deleteOneById(id: string) {
    const user = await this.findOneBy({
      method: 'id',
      toFind: id,
    });

    try {
      await this.userRepository.softDelete(id);
      return { message: 'User deleted successfully' };
    } catch (error) {
      handleDbError(error);
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async allowAccess(userId: string) {
    const user = await this.findOneBy({
      method: 'id',
      toFind: userId,
    });

    const accessLog = this.accessLogRepository.create({
      user,
    });

    try {
      await this.accessLogRepository.insert(accessLog);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async getAccessLogs() {
    return this.accessLogRepository.find({
      relations: { user: true },
    });
  }
}
