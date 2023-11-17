import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('bool', { nullable: false, default: false })
  used: boolean;

  @ManyToOne(() => User, (user) => user.passwordResets)
  user: User;
}
