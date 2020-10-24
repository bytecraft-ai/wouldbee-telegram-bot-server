import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
// import { User } from './user.entity';

@Entity()
export class TelegramProfile {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(type => Profile)
    profile: Profile;

    @CreateDateColumn()
    createdOn?: Date;

    @Column({ unique: true })
    telegramUserId: number;

    @Column({ unique: true })
    telegramChatId: number;
}