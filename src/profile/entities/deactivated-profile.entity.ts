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

    // @Field()
    @OneToOne(
        type => Profile,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    profile: Profile;

    // @CreateDateColumn()
    // deactivatedOn?: Date;

    // // This will be null if the deactivation is done by the system
    // // upon activation, the record will be deleted
    // @Column({ nullable: true })
    // activateOn?: Date;
}