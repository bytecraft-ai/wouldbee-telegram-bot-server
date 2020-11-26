import {
    Entity,
    ObjectIdColumn,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    PrimaryColumn
} from 'typeorm';
import { State } from './state.entity';
import { IsNumber, Length, Max, Min } from 'class-validator';
import { cityMaxLength, cityMinLength } from 'src/common/field-length';


// TODO: implement table indexing on important columns

@Entity()
export class City {
    @PrimaryColumn()
    id?: number;

    @Length(cityMinLength, cityMaxLength)
    @Column("varchar", { length: cityMaxLength })
    name: string;

    @Max(90.0)
    @Min(-90.0)
    @IsNumber()
    @Column("float8", { nullable: true })
    latitude?: number;

    @Max(180.0)
    @Min(-180.0)
    @IsNumber()
    @Column("float8", { nullable: true })
    longitude?: number;

    @Column()
    stateId?: number;

    @ManyToOne(type => State, state => state.cities, { eager: true })
    @JoinColumn()
    state: State;
}
