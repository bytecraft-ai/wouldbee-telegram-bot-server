import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    ManyToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { User } from './user.entity';

@Entity()
export class SharedProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    sentOn?: Date;

    // @PrimaryColumn()
    @Column()
    sharedProfileId: string;

    @ManyToOne(type => Profile, { eager: true })
    @JoinColumn({ name: "sharedProfileId" })
    sharedProfile: Profile;

    // @PrimaryColumn()
    @Column()
    sentToUserId: string;

    @ManyToOne(type => User, { eager: true })
    @JoinColumn({ name: "sentToUserId" })
    sentTo: User;
}