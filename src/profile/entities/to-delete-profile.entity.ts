import { UserStatus } from 'src/common/enum';
import {
    Entity,
    Column,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from 'typeorm';
import { TelegramAccount } from './telegram-account.entity';

@Entity()
export class ProfileMarkedForDeletion {
    @PrimaryColumn("uuid")
    id: string;

    @OneToOne(
        type => TelegramAccount,
        telegramAccount => telegramAccount.profileToDelete,
        { nullable: false }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    telegramAccount: TelegramAccount;

    @CreateDateColumn()
    markedOn?: Date;

    // profile may or may not exist
    @Column({ nullable: true })
    lastActiveStatus?: boolean;

    @Column("smallint")
    lastProfileStatus: UserStatus;

    @Column()
    deleteOn: Date;
}