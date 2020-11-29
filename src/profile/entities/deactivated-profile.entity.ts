import {
    Entity,
    Column,
    CreateDateColumn,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class DeactivatedProfile {
    @PrimaryColumn("uuid")
    id: string;

    @OneToOne(
        type => Profile,
        profile => profile.deactivatedProfile,
        { nullable: false }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    profile: Profile;

    @CreateDateColumn()
    deactivatedOn?: Date;

    /**
     * This will be null if the deactivation is done by the system.
     * upon activation, the row will be hard deleted from table
     */
    @Column({ nullable: true })
    activateOn: Date;
}