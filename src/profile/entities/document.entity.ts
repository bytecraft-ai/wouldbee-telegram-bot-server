import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    JoinColumn,
    DeleteDateColumn,
    OneToOne,
} from 'typeorm';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { urlMaxLength } from 'src/common/field-length';
import { TypeOfDocument, TypeOfIdProof } from 'src/common/enum';
import { TelegramProfile } from './telegram-profile.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { AwsDocument } from './aws-document.entity';
import { InvalidDocument } from './invalid-document.entity';

@Entity()
export class Document extends Verifiable {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("uuid")
    telegramProfileId: string;

    @ManyToOne(
        type => TelegramProfile,
        telegramProfile => telegramProfile.documents,
        { nullable: false }
    )
    @JoinColumn({
        name: "telegramProfileId",
        referencedColumnName: "id",
    })
    telegramProfile: TelegramProfile;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @Column("smallint")
    typeOfDocument: TypeOfDocument;

    @Column("smallint", { nullable: true })
    typeOfIdProof?: TypeOfIdProof;

    @IsString()
    @Column("varchar", { length: urlMaxLength })
    telegramFileId: string;

    // null - unverified, false - invalid/old and not in use, true - currently in use 
    @IsOptional()
    @IsBoolean()
    @Column({ nullable: true })
    active?: boolean;

    @OneToOne(type => AwsDocument, awsDocument => awsDocument.document)
    awsDocument?: AwsDocument;

    @OneToOne(type => InvalidDocument, invalidDoc => invalidDoc.document)
    invalidDocument?: InvalidDocument;
}
