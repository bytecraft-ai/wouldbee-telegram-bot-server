import {
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Agent } from 'src/agent/entities/agent.entity';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { docRejectionReasonMaxLength } from 'src/common/field-length';
import { DocRejectionReason } from 'src/common/enum';

export abstract class Verifiable {

    // Default: null => not checked yet
    // true => checked and found to be good
    // false => checked and found to be bad
    //
    // @Column({ "nullable": true, "default": () => null })
    @Column({ "nullable": true })
    isValid?: boolean;

    @Column({ "nullable": true })
    verifiedOn?: Date;

    @Column("uuid", { nullable: true })
    verifierId?: string;

    @ManyToOne(type => Agent, { nullable: true })
    @JoinColumn({ name: "verifierId" })
    verifiedBy?: Agent;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("smallint", { nullable: true })
    invalidationReason?: DocRejectionReason;

    @IsOptional()
    @IsPositive()
    @IsInt()
    @Column("varchar", { nullable: true, length: docRejectionReasonMaxLength })
    invalidationDescription?: string;
}