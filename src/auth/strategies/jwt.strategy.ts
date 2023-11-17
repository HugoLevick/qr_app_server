import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AuthJwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: AuthJwtPayload): Promise<User> {
    const { userId } = payload;

    if (!userId) throw new UnauthorizedException('Token not valid');

    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user', 'user.verified'])
      .where('id = :userId', { userId })
      .getOne();

    if (!user) throw new UnauthorizedException('Token not valid');

    return user;
  }
}
