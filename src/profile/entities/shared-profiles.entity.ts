// import { ProfileSharedWith } from 'src/common/enum';
// import {
//     Entity,
//     Column,
//     PrimaryGeneratedColumn,
//     CreateDateColumn,
//     JoinColumn,
//     ManyToOne,
//     PrimaryColumn,
// } from 'typeorm';
// import { Profile } from './profile.entity';
// // import { User } from './user.entity';

// @Entity()
// export class SharedMatch {
//     @PrimaryGeneratedColumn()
//     id: number;

//     @CreateDateColumn()
//     createdOn?: Date;

//     @PrimaryColumn()
//     // @Column()
//     maleProfileId: string;

//     @ManyToOne(type => Profile, { eager: false, nullable: false, })
//     @JoinColumn({ name: "maleProfileId" })
//     maleProfile: Profile;

//     @PrimaryColumn()
//     // @Column()
//     femaleProfileId: string;

//     @ManyToOne(type => Profile, { eager: false, nullable: false, })
//     @JoinColumn({ name: "femaleProfileId" })
//     femaleProfile: Profile;

//     @Column("smallint")
//     profileSharedWith: ProfileSharedWith;
// }