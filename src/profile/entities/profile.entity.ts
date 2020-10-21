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
} from 'typeorm';
import {
    Gender,
    Religion,
    AnnualIncome,
} from '../../common/enum';
import { IsString, Length } from 'class-validator';
import { Country } from './country.entity';
import { nameMaxLength, nameMinLength } from 'src/common/field-length';
import { Caste } from './caste.entity';
import { City } from './city.entity';
import { PartnerPreference } from './partner-preference.entity';
import { User } from './user.entity';
import { SharedProfile } from './shared-profiles.entity';

// TODO: implement table indexing on important columns

@Entity()
export class Profile {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(
        type => User,
        user => user.profile,
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
    createdOn: Date;

    @UpdateDateColumn()
    updatedOn: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @Column({ unique: true })
    email: string;

    @Column("int")
    countryId: number;

    @ManyToOne(type => Country, { eager: true })
    @JoinColumn()
    country: Country;

    @Column({ unique: true })
    @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    phone: string;

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

    // @Column({ type: "enum", enum: AnnualIncome })
    @Column("smallint")
    annualIncome: AnnualIncome;

    @OneToOne(type => PartnerPreference)
    partnerPreference: PartnerPreference;

    @OneToMany(
        type => SharedProfile,
        sharedProfile => sharedProfile.sharedProfile,
        { nullable: true }
    )
    sharedWithUsers: SharedProfile[];

    // @Column({ default: () => `now()` })
    // lastSeen: Date;

    // @Column("smallint", { nullable: true })
    // reasonForDeletion?: AccountDeletionReason;

    // @Column("smallint")
    // @Column({ type: "enum", enum: MaritalStatus })
    // motherTongue: Language;

    // @Column({ type: "enum", enum: MaritalStatus })
    // @Column("smallint")
    // maritalStatus: MaritalStatus;

    // @Column("uuid", { unique: true, nullable: false })
    // @Generated("uuid")
    // publicId: string;

    // @Column({ unique: true, nullable: false })
    // sharableId?: string;

    // @Column({ unique: true, nullable: true })
    // notificationId?: string;
}
