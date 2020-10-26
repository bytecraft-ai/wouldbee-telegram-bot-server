import {
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Agent } from 'src/agent/entities/agent.entity';

export abstract class Verifiable {

    // Default: null => not checked yet
    // true => checked and found to be good
    // false => checked and found to be bad
    //
    // @Column({ "nullable": true, "default": () => null })
    @Column({ "nullable": true })
    isVerified: boolean;

    @Column({ "nullable": true })
    verifiedOn: Date;

    @Column({ nullable: true })
    verifierId: number;

    @ManyToOne(type => Agent, { nullable: true })
    @JoinColumn({ name: "verifierId" })
    verifiedBy: Agent;
}