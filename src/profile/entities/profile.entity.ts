import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
    OneToOne,
    OneToMany,
    PrimaryColumn,
} from 'typeorm';
import {
    Gender,
    Religion,
    AnnualIncome,
    Occupation,
    EmployedIn,
    EducationDegree,
} from '../../common/enum';
import { IsString, Length } from 'class-validator';
import { Country } from './country.entity';
import { nameMaxLength, nameMinLength } from 'src/common/field-length';
import { Caste } from './caste.entity';
import { City } from './city.entity';
import { PartnerPreference } from './partner-preference.entity';
// import { SharedMatch } from './shared-profiles.entity';
import { TelegramProfile } from './telegram-profile.entity';
import { Language, MaritalStatus } from 'src/common/enum';
// import { IdProof } from './id-proof.entity';
// import { ProfilePicture } from './picture.entity';
// import { BioData } from './bio-data.entity';
// import { Document } from './update.entity';
// import { User } from './user.entity';

// TODO: implement table indexing on important columns

@Entity()
export class Profile {
    @PrimaryColumn("uuid")
    id: string;

    @OneToOne(
        type => TelegramProfile,
        telegramProfile => telegramProfile.profile,
        {
            // Can't use as part of composite primary key without this.
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    telegramProfile: TelegramProfile;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    // @Column({ unique: true })
    // email: string;

    @Column("int")
    countryId?: number;

    // @ManyToOne(type => Country)
    // @JoinColumn()
    // country?: Country;

    // @Column({ unique: true })
    // @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    // phone?: string;

    @Length(nameMinLength, nameMaxLength)
    @IsString()
    @Column()
    name: string;

    @Column("smallint")
    gender: Gender;

    // TODO: add constraint that the age should be >= 21 years for males and >= 18 years for females.
    @Column("date")
    dob: Date;

    // @Column({ type: "enum", enum: Religion })
    @Column("smallint")
    religion: Religion;

    @Column("int")
    casteId: number;

    @ManyToOne(type => Caste)
    @JoinColumn()
    caste: Caste;

    @Column("int")
    cityId: number;

    // TODO: also target village dwellers?
    @ManyToOne(type => City)
    @JoinColumn()
    city: City;

    @Column("smallint")
    highestDegree: EducationDegree;

    @Column("smallint")
    employedIn: EmployedIn;

    @Column("smallint")
    occupation: Occupation;

    // @Column({ type: "enum", enum: AnnualIncome })
    @Column("smallint")
    annualIncome: AnnualIncome;

    @Column("smallint", { nullable: true })
    motherTongue?: Language;

    @Column("smallint", { nullable: true })
    maritalStatus?: MaritalStatus;

    @OneToOne(type => PartnerPreference)
    partnerPreference: PartnerPreference;

    // @OneToOne(type => IdProof, idProof => idProof.profile)
    // idProof: IdProof;

    // @OneToOne(type => ProfilePicture, picture => picture.profile)
    // picture: ProfilePicture;

    // @OneToOne(type => BioData, bioData => bioData.profile)
    // bioData: BioData;

    // @OneToMany(type => Document, update => update.profile)
    // updates: Document[]

    // // profile shared with other profiles
    // @OneToMany(
    //     type => SharedMatch,
    //     sharedProfile => sharedProfile.sharedProfile,
    //     { nullable: true }
    // )
    // sharedWithProfiles: SharedMatch[];

    // // profiles shared with this profile
    // @OneToMany(
    //     type => SharedMatch,
    //     sharedProfile => sharedProfile.sentToProfile,
    //     { nullable: true }
    // )
    // sharedProfiles: SharedMatch[];

    // @Column({ default: () => `now()` })
    // lastSeen: Date;

    // @Column("smallint", { nullable: true })
    // reasonForDeletion?: AccountDeletionReason;

    // @Column({ unique: true, nullable: false })
    // sharableId?: string;

    // @Column({ unique: true, nullable: true })
    // notificationId?: string;

}
