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
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { bioRejectionReasonMaxLength, fileNameMaxLength, fileNameMinLength, mimeMaxLength, urlMaxLength } from 'src/common/field-length';
import { BioRejectionReason, TypeOfDocument, TypeOfIdProof } from 'src/common/enum';
import { TelegramProfile } from './telegram-profile.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { AwsDocument } from './aws-document.entity';
import { InvalidDocument } from './invalid-document.entity';


// Records all document updates.
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

    // @OneToOne(type => AwsDocument, awsDocument => awsDocument.document)
    // awsDocument?: AwsDocument;

    // @OneToOne(type => InvalidDocument, invalidDoc => invalidDoc.document)
    // invalidDocument?: InvalidDocument;

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

    @Column({ type: "smallint" })
    invalidationReason: BioRejectionReason;

    @Column("varchar", { nullable: true, length: bioRejectionReasonMaxLength })
    invalidationDescription: BioRejectionReason;
}
