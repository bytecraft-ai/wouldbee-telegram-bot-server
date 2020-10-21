import {
    Entity,
    ObjectIdColumn,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';
import { IsEmail, IsNumber, IsNumberString, IsPositive, IsString, Length } from 'class-validator';
import { Country } from './country.entity';
import { Profile } from './profile.entity';
import { TelegramProfile } from './telegram-profile.entity';
import { SharedProfile } from './shared-profiles.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @CreateDateColumn()
    createdOn?: Date;

    @IsEmail()
    @Column({ unique: true, nullable: true })
    email?: string;

    @IsPositive()
    @IsNumber()
    @Column()
    countryId: number;

    @ManyToOne(type => Country)
    @JoinColumn()
    country: Country;

    @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    @IsNumberString()
    @Column({ unique: true })
    phone: string;

    @OneToOne(type => Profile)
    profile: Profile;

    @OneToOne(type => TelegramProfile)
    telegramProfile: TelegramProfile;

    @OneToMany(
        type => SharedProfile,
        sharedProfile => sharedProfile.sentTo,
        { nullable: true }
    )
    sharedProfiles: SharedProfile[];
}