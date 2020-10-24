import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
} from 'typeorm';
import { State } from './state.entity';
import { IsString, Length } from 'class-validator';
import { fileNameMaxLength, fileNameMinLength, urlMaxLength } from 'src/common/field-length';
import { Agent } from 'http';
import { TypeOfDocument } from 'src/common/enum';

@Entity()
export class Document {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @Column("smallint")
    typeOfDocument: TypeOfDocument;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column("varchar", { length: fileNameMaxLength })
    fileName: string;

    @Length(40, urlMaxLength)
    @IsString()
    @Column("varchar", { length: urlMaxLength })
    Url: string;

    @Column({ nullable: true })
    isVerified: boolean;

    @ManyToOne(type => Agent)
    @Column()
    verifiedBy: Agent;
}
