import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';
import { Document } from './document.entity';
import { Profile } from './profile.entity';

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

    // allow creating profile before phone number is verified.
    @Column({ unique: true, nullable: true })
    phone?: string;

    @OneToMany(type => Document, document => document.telegramProfile)
    documents: Document[]
}