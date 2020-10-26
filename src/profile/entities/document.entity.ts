import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    JoinColumn,
    PrimaryColumn,
    DeleteDateColumn,
} from 'typeorm';
import { State } from './state.entity';
import { IsString, Length } from 'class-validator';
import { fileNameMaxLength, fileNameMinLength, urlMaxLength } from 'src/common/field-length';
import { Agent } from 'http';
import { TypeOfDocument, TypeOfIdProof } from 'src/common/enum';
import { Profile } from './profile.entity';
import { TelegramProfile } from './telegram-profile.entity';

@Entity()
export class Document {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @ManyToOne(
        type => TelegramProfile,
        telegramProfile => telegramProfile.documents,
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

    @PrimaryColumn("smallint")
    typeOfDocument: TypeOfDocument;

    @Column("smallint", { nullable: true })
    typeOfIdProof: TypeOfIdProof;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @DeleteDateColumn()
    deletedOn: Date;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column("varchar", { length: fileNameMaxLength })
    fileName: string;

    @Length(40, urlMaxLength)
    @IsString()
    @Column("varchar", { length: urlMaxLength })
    url: string;

    @IsString()
    @Column("varchar", { length: urlMaxLength })
    telegramFileId: string;
}
