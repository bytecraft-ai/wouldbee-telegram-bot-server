import {
    Entity,
    ObjectIdColumn,
    Column,
    PrimaryGeneratedColumn
} from 'typeorm';
import {
    Religion,
} from '../../common/enum';
import { IsString, Length } from 'class-validator';
import { casteMaxLength, casteMinLength } from 'src/common/field-length';


// TODO: implement table indexing on important columns

@Entity()
export class Caste {
    @ObjectIdColumn()
    _id: string;

    @PrimaryGeneratedColumn()
    id: number;

    @Length(casteMinLength, casteMaxLength)
    @IsString()
    @Column("varchar", { length: casteMaxLength })
    name: string;

    @Column("smallint")
    // @Column({ type: "enum", enum: Religion })
    religion: Religion;
}
