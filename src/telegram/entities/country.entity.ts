import { IsString, Length, MaxLength } from 'class-validator';
import { countryMaxLength, phoneCodeMaxLength } from 'src/common/field-length';
import {
    Entity,
    ObjectIdColumn,
    Column,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { State } from './state.entity';

// TODO: implement table indexing on important columns

@Entity()
export class Country {
    @ObjectIdColumn()
    _id: string;

    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @Column("varchar", { length: countryMaxLength, unique: true })
    name: string;

    @Length(3, 3)
    @Column("varchar", { length: 3, unique: true })
    iso3: string;

    @Length(2, 2)
    @Column("varchar", { length: 2, unique: true })
    iso2: string;

    // can't be unique as a few are empty (two empties are equal so not unique)
    @MaxLength(phoneCodeMaxLength)
    @Column("varchar", { length: phoneCodeMaxLength })
    phoneCode: string

    @OneToMany(type => State, state => state.country, { eager: false })
    states: State[]
}
