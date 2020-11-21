import { IsString, Length, MaxLength } from 'class-validator';
import { countryMinLength, countryMaxLength, phoneMaxLength } from 'src/common/field-length';
import {
    Entity,
    Column,
    OneToMany,
    PrimaryGeneratedColumn,
    PrimaryColumn,
} from 'typeorm';
import { State } from './state.entity';

// TODO: implement table indexing on important columns
// TODO: make name unique
@Entity()
export class Country {

    @PrimaryColumn()
    id?: number;

    @Length(countryMinLength, countryMaxLength)
    @IsString()
    @Column("varchar", { length: countryMaxLength, unique: true })
    name: string

    @Length(3, 3)
    @Column("varchar", { length: 3, unique: true })
    iso3: string

    @Length(2, 2)
    @Column("varchar", { length: 2, unique: true })
    iso2: string

    // can't be unique as a few are empty (two empties are equal so not unique)
    @MaxLength(phoneMaxLength)
    @Column("varchar", { length: phoneMaxLength, nullable: false })
    phoneCode: string

    @OneToMany(type => State, state => state.country, { eager: false })
    states: State[]
}
