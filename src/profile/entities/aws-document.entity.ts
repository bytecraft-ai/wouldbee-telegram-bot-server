import { IsString, Length } from 'class-validator';
import { fileNameMaxLength, fileNameMinLength, mimeMaxLength, urlMaxLength } from 'src/common/field-length';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    OneToOne,
    DeleteDateColumn,
    UpdateDateColumn,
    CreateDateColumn,
    PrimaryColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity()
export class AwsDocument {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    documentId: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "documentId",
        referencedColumnName: "id",
    })
    document: Document;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column("varchar", { length: fileNameMaxLength })
    fileName: string;

    @Length(40, urlMaxLength)
    @IsString()
    @Column("varchar", { length: urlMaxLength })
    url: string;

    @Column("varchar", { length: mimeMaxLength })
    mimeType: string;
}
