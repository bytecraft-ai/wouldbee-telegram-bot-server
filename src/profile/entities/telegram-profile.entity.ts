import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { Agent } from 'src/agent/entities/agent.entity';
import { ProfileDeletionReason, ReasonForProfileBan, UserStatus } from 'src/common/enum';
import { docRejectionReasonMaxLength } from 'src/common/field-length';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    OneToMany,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
} from 'typeorm';
import { Verifiable } from './abstract-verifiable.entity';
import { Document } from './document.entity';
// import { BioData } from './bio-data.entity';
// import { IdProof } from './id-proof.entity';
// import { ProfilePicture } from './picture.entity';
import { Profile } from './profile.entity';

@Entity()
export class TelegramProfile extends Verifiable {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(type => Profile, profile => profile.telegramProfile)
    profile?: Profile;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @Column({ unique: true })
    telegramUserId: number;

    @Column({ unique: true })
    telegramChatId: number;

    // allow creating profile before phone number is verified.
    @Column({ unique: true, nullable: true })
    phone?: string;

    @OneToMany(type => Document, document => document.telegramProfile)
    documents?: Document[];

    @Column({ nullable: true })
    bioDataId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "bioDataId",
        referencedColumnName: "id",
    })
    bioData?: Document;

    @Column({ nullable: true })
    pictureId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "pictureId",
        referencedColumnName: "id",
    })
    picture?: Document;

    @Column({ nullable: true })
    idProofId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "idProofId",
        referencedColumnName: "id",
    })
    idProof?: Document;

    @Column({ nullable: true })
    unverifiedBioDataId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "unverifiedBioDataId",
        referencedColumnName: "id",
    })
    unverifiedBioData?: Document;

    @Column({ nullable: true })
    unverifiedPictureId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "unverifiedPictureId",
        referencedColumnName: "id",
    })
    unverifiedPicture?: Document;

    @Column({ nullable: true })
    unverifiedIdProofId?: number;

    @OneToOne(type => Document)
    @JoinColumn({
        name: "unverifiedIdProofId",
        referencedColumnName: "id",
    })
    unverifiedIdProof?: Document;

    // @Column({ nullable: true })
    // isBanned?: boolean;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    status?: UserStatus;

    @Column({ "nullable": true })
    bannedOn?: Date;

    @Column("uuid", { nullable: true })
    bannedById?: string;

    @ManyToOne(type => Agent, { nullable: true })
    @JoinColumn({ name: "bannedById" })
    bannedBy?: Agent;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    reasonForBan?: ReasonForProfileBan;

    @IsOptional()
    @MaxLength(docRejectionReasonMaxLength)
    @IsString()
    @Column("varchar", { nullable: true, length: docRejectionReasonMaxLength })
    banDescription?: string;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    reasonForDeletion?: ProfileDeletionReason;
}