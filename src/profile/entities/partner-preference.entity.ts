import {
    Entity,
    ObjectIdColumn,
    Column,
    JoinColumn,
    OneToOne,
    ManyToMany,
    JoinTable,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    Check
} from 'typeorm';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { City } from './city.entity';
import { Profile } from './profile.entity';
import { AnnualIncome, MaritalStatus, Religion } from 'src/common/enum';
import { Caste } from './caste.entity';
import { Country } from './country.entity';
import { State } from './state.entity';
import { Exclude } from 'class-transformer';


// TODO: implement table indexing on important columns

@Entity()
@Check(`"minAge" >= 18`)
@Check(`"maxAge" >= 18`)
export class PartnerPreference {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // To create an identifying relationship without creating a separate primary key,
    // I used the following reference - 
    // https://github.com/mattwelke/example-typeorm-postgres/blob/master/src/models/Appointment.ts
    @OneToOne(
        type => Profile,
        profile => profile.partnerPreference,
        {
            // Can't use as part of composite primary key without this.
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    profile: Profile;

    @Column({ nullable: true })
    minAge: number;

    @Column({ nullable: true })
    maxAge: number;

    @IsOptional()
    @Length(5, 15)
    @IsString()
    @Column("smallint", { nullable: true })
    minimumIncome?: AnnualIncome;

    @IsOptional()
    @Length(5, 15)
    @IsString()
    @Column("smallint", { nullable: true })
    maximumIncome?: AnnualIncome;

    @Column("enum", { enum: Religion, array: true, nullable: true })
    religions?: Religion[];

    @Column("enum", { enum: MaritalStatus, array: true, nullable: true })
    maritalStatuses: MaritalStatus[];

    // eager is helpful in the "getMatch" function in the `profile.service.ts` 
    @ManyToMany(type => Caste, { eager: true, nullable: true })
    @JoinTable()
    castes?: Caste[];

    @ManyToMany(type => City, { eager: true, nullable: true })
    @JoinTable()
    cities?: City[];

    @ManyToMany(type => State, { eager: true, nullable: true })
    @JoinTable()
    states?: State[];

    @ManyToMany(type => Country, { eager: true, nullable: true })
    @JoinTable()
    countries?: Country[];

    @Exclude()
    @DeleteDateColumn()
    deletedOn?: Date;

    // @IsOptional()
    // @Length(5, 15)
    // @IsString()
    // @Column("int4range", { nullable: true })
    // heightRange?: string;

    // @IsOptional()
    // @Length(5, 15)
    // @IsString()
    // @Column("int4range", { nullable: true })
    // weightRange?: string;

    // // eager is helpful in the "getMatch" function in the `profile.service.ts` 
    // @ManyToMany(type => SubCaste, { eager: true, nullable: true })
    // @JoinTable()
    // subCastes?: SubCaste[];

    // @Column({ nullable: true })
    // leaveSelfGotra?: boolean;

    // @Column({ nullable: true })
    // leaveMothersGotra?: boolean;

    // @Column("smallint", { array: true, nullable: true })
    // diets: DietaryChoice[];

    // @Column({ nullable: true })
    // smoke?: boolean;

    // @Column({ nullable: true })
    // drink?: boolean;

    // @Column("enum", { enum: EducationDegree, array: true, nullable: true })
    // degrees?: EducationDegree[];

    // @Column("enum", { enum: Occupation, array: true, nullable: true })
    // occupations?: Occupation[];

    // @Column("enum", { enum: ChildrenLivingTogether, array: true, nullable: true })
    // childrenStatuses: ChildrenLivingTogether[];
    // // childrenStatus: HaveChildren;

    // @Column("enum", { enum: Disability, array: true, nullable: true })
    // disabilities: Disability[];

    // @Column("enum", { enum: MajorDisease, array: true, nullable: true })
    // majorDiseases: MajorDisease[];
}