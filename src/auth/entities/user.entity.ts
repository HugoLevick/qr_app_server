import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RolesEnum } from '../enums/roles.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { select: false, nullable: false })
  password: string;

  @Column('text', { nullable: false, unique: true })
  email: string;

  @Column('enum', { enum: RolesEnum, default: RolesEnum.USER })
  rol: RolesEnum;
}
