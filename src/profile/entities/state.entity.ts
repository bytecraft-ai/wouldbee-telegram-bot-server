import {
    Entity,
    Column,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn
} from 'typeorm';
import { IsString, Length, MaxLength } from 'class-validator';
import { stateCodeMaxLength, stateMaxLength, stateMinLength } from 'src/common/field-length';
import { Country } from './country.entity';
import { City } from './city.entity';


// TODO: implement table indexing on important columns

@Entity()
export class State {
    @PrimaryColumn()
    id?: number;

    @Length(stateMinLength, stateMaxLength)
    @IsString()
    @Column("varchar", { length: stateMaxLength })
    name: string

    @MaxLength(stateCodeMaxLength)
    @IsString()
    @Column("varchar", { length: stateCodeMaxLength, nullable: true })
    stateCode: string

    @Column()
    countryId: number

    @ManyToOne(type => Country, country => country.states, { eager: true })
    @JoinColumn()
    country: Country

    @OneToMany(type => City, city => city.state, { eager: false })
    cities: City[]

}
