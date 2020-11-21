import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    JoinColumn,
    DeleteDateColumn,
    // OneToOne,
} from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, Length, MaxLength } from 'class-validator';
import { docRejectionReasonMaxLength, fileNameMaxLength, fileNameMinLength, mimeMaxLength, urlMaxLength } from 'src/common/field-length';
import { DocRejectionReason, TypeOfDocument, TypeOfIdProof } from 'src/common/enum';
import { TelegramAccount } from './telegram-profile.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { Exclude } from 'class-transformer';
// import { AwsDocument } from './aws-document.entity';
// import { InvalidDocument } from './invalid-document.entity';


// Records all document updates.
@Entity()
export class Document extends Verifiable {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("uuid")
    telegramProfileId: string;

    @ManyToOne(
        type => TelegramAccount,
        telegramProfile => telegramProfile.documents,
        { nullable: false }
    )
    @JoinColumn({
        name: "telegramProfileId",
        referencedColumnName: "id",
    })
    telegramProfile: TelegramAccount;

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

    @Exclude()
    @IsString()
    @Column("varchar", { length: urlMaxLength })
    telegramFileId: string;

    // null - unverified, false - invalid/old and not in use, true - currently in use 
    @IsOptional()
    @IsBoolean()
    @Column({ nullable: true })
    isActive?: boolean;

    @IsOptional()
    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column("varchar", { length: fileNameMaxLength, nullable: true })
    fileName?: string;

    @IsOptional()
    @Length(40, urlMaxLength)
    @IsString()
    @Column("varchar", { length: urlMaxLength, nullable: true })
    url?: string;

    @IsOptional()
    @Column("varchar", { length: mimeMaxLength, nullable: true })
    mimeType?: string;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    invalidationReason?: DocRejectionReason;

    @IsOptional()
    @MaxLength(docRejectionReasonMaxLength)
    @IsString()
    @Column("varchar", { nullable: true, length: docRejectionReasonMaxLength })
    invalidationDescription?: string;
}
