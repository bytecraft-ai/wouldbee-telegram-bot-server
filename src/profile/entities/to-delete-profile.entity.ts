import { UserStatus } from 'src/common/enum';
import {
    Entity,
    Column,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from 'typeorm';
import { TelegramProfile } from './telegram-profile.entity';

@Entity()
export class ProfileMarkedForDeletion {
    @PrimaryColumn("uuid")
    id: string;

    @OneToOne(
        type => TelegramProfile,
        // telegramProfile => telegramProfile.profileToDelete,
        { nullable: false }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    telegramProfile: TelegramProfile;

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