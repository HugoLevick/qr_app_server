import {
  Column,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolesEnum } from '../enums/roles.enum';
import { PasswordReset } from './password-reset.entity';
import { AccessLog } from './access-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  lastName: string;

  @Column('text', { select: false, nullable: false })
  password: string;

  @Column('text', { nullable: false, unique: true })
  email: string;

  @Column('enum', { enum: RolesEnum, default: RolesEnum.USER })
  role: RolesEnum;

  @Column('bool', { default: false, nullable: false, select: false })
  verified: boolean;

  @OneToMany(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordResets: PasswordReset[];

  @OneToMany(() => AccessLog, (accessLog) => accessLog.user)
  accessLogs: AccessLog[];

  @DeleteDateColumn({ select: false })
  deletedAt?: Date;
}
