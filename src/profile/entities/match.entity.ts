import { ProfileSharedWith } from 'src/common/enum';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    ManyToOne,
    DeleteDateColumn,
    PrimaryColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
// import { User } from './user.entity';

@Entity()
export class Match {
    // @PrimaryGeneratedColumn()
    // id: number;

    @CreateDateColumn()
    createdOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @PrimaryColumn()
    // @Column()
    maleProfileId: string;

    @ManyToOne(type => Profile, { eager: false, nullable: false, })
    @JoinColumn({ name: "maleProfileId" })
    maleProfile: Profile;

    @PrimaryColumn()
    // @Column()
    femaleProfileId: string;

    @ManyToOne(type => Profile, { eager: false, nullable: false, })
    @JoinColumn({ name: "femaleProfileId" })
    femaleProfile: Profile;

    @Column("smallint", { default: ProfileSharedWith.NONE })
    profileSharedWith: ProfileSharedWith;
}