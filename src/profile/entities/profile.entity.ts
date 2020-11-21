import {
    Entity,
    Column,
    ManyToOne,
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
import { nameMaxLength, nameMinLength } from 'src/common/field-length';
import { Caste } from './caste.entity';
import { City } from './city.entity';
import { PartnerPreference } from './partner-preference.entity';
import { TelegramProfile } from './telegram-profile.entity';
import { Language, MaritalStatus } from 'src/common/enum';
import { DeactivatedProfile } from './deactivated-profile.entity';

// TODO: implement table indexing on important columns

// @ObjectType('Profile')
@Entity()
export class Profile {
    // @Field(type => ID)
    @PrimaryColumn("uuid")
    id: string;

    // @Field()
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

    // @Field()
    @CreateDateColumn()
    createdOn?: Date;

    // @Field()
    @UpdateDateColumn()
    updatedOn?: Date;

    // @Field()
    @DeleteDateColumn()
    deletedOn?: Date;

    // @Column({ unique: true })
    // email: string;

    // @Column("int")
    // countryId?: number;

    // @ManyToOne(type => Country)
    // @JoinColumn()
    // country?: Country;

    // @Column({ unique: true })
    // @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    // phone?: string;

    // @Field()
    @Length(nameMinLength, nameMaxLength)
    @IsString()
    @Column()
    name: string;

    // @Field()
    @Column("smallint")
    gender: Gender;

    // TODO: add constraint that the age should be >= 21 years for males and >= 18 years for females.
    // @Field()
    // @Column("timestamp")
    @Column("date")
    dob: Date;

    // @Column({ type: "enum", enum: Religion })
    // @Field()
    @Column("smallint")
    religion: Religion;

    @Column("int")
    casteId: number;

    // @Field()
    @ManyToOne(type => Caste)
    @JoinColumn()
    caste: Caste;

    @Column("int")
    cityId: number;

    // TODO: also target village dwellers?
    // @Field()
    @ManyToOne(type => City)
    @JoinColumn()
    city: City;

    // @Field()
    @Column("smallint")
    highestDegree: EducationDegree;

    // @Field()
    @Column("smallint")
    employedIn: EmployedIn;

    // @Field()
    @Column("smallint")
    occupation: Occupation;

    // @Field()
    // @Column({ type: "enum", enum: AnnualIncome })
    @Column("smallint")
    annualIncome: AnnualIncome;

    // @Field()
    @Column("smallint", { nullable: true })
    motherTongue?: Language;

    // @Field()
    @Column("smallint", { nullable: true })
    maritalStatus?: MaritalStatus;

    // @Field()
    @OneToOne(type => PartnerPreference)
    partnerPreference?: PartnerPreference;

    @OneToOne(type => DeactivatedProfile)
    deactivatedProfile?: DeactivatedProfile;

    @Column({ default: true })
    active: boolean;

    // @Column({ default: () => `now()` })
    // lastSeen: Date;
}
