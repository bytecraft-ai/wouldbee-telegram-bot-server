import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class TelegramProfile {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(
        type => User,
        user => user.telegramProfile,
        {
            // Can't use as part of composite primary key without this.
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    user: User;

    @CreateDateColumn()
    createdOn?: Date;

    @Column({ unique: true })
    telegramUserId: number;

    @Column({ unique: true })
    telegramChatId: number;
}