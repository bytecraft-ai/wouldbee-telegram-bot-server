import {
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { WbAgent } from 'src/agent/entities/agent.entity';

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

    @ManyToOne(type => WbAgent, { nullable: true })
    @JoinColumn({ name: "verifierId" })
    verifiedBy?: WbAgent;
}