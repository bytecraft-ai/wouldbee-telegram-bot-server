import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    CreateDateColumn,
    JoinColumn,
    DeleteDateColumn,
} from 'typeorm';
import { IsInt, IsOptional, IsPositive, IsString, Length } from 'class-validator';
import { supportQueryMaxLength, supportQueryMinLength, supportResolutionMinLength, supportResolutionMaxLength } from 'src/common/field-length';
import { SupportTicketCategory } from 'src/common/enum';
import { TelegramAccount } from './telegram-account.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { WbAgent } from 'src/agent/entities/agent.entity';
import { Exclude } from 'class-transformer';


// Records all document updates.
@Entity()
export class Support extends Verifiable {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("uuid")
    telegramAccountId: string;

    @ManyToOne(
        type => TelegramAccount,
        telegramAccount => telegramAccount.documents,
        { nullable: false }
    )
    @JoinColumn({
        name: "telegramAccountId",
        referencedColumnName: "id",
    })
    telegramAccount: TelegramAccount;

    @IsOptional()
    @Length(supportQueryMinLength, supportQueryMaxLength)
    @IsString()
    @Column("varchar", { nullable: true, length: supportQueryMaxLength })
    issueDescription: string;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @Exclude()
    @DeleteDateColumn()
    deletedOn?: Date;

    @Column({ default: false })
    resolved: boolean;

    @Column({ nullable: true })
    resolvedOn?: Date;

    @Column("uuid", { nullable: true })
    resolverId?: string;

    @ManyToOne(type => WbAgent, { nullable: true })
    @JoinColumn({ name: "resolverId" })
    resolvedBy?: WbAgent;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    category?: SupportTicketCategory;

    @IsOptional()
    @Length(supportResolutionMinLength, supportResolutionMaxLength)
    @IsString()
    @Column("varchar", { nullable: true, length: supportResolutionMaxLength })
    resolution?: string;
}
