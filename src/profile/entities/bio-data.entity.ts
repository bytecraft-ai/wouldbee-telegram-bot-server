// import {
//     Entity,
//     Column,
//     ManyToOne,
//     PrimaryGeneratedColumn,
//     CreateDateColumn,
//     OneToOne,
//     PrimaryColumn,
//     JoinColumn,
//     DeleteDateColumn,
// } from 'typeorm';
// import { Profile } from './profile.entity';
// import { Verifiable } from './abstract-verifiable.entity';
// import { IsString, IsUrl, Length } from 'class-validator';
// import { fileNameMaxLength, fileNameMinLength, mimeMaxLength, urlMaxLength } from 'src/common/field-length';
// import { TelegramProfile } from './telegram-profile.entity';

// // TODO: implement table indexing on important columns

// @Entity()
// export class BioData extends Verifiable {

//     @PrimaryGeneratedColumn()
//     id: number;

//     @Column("uuid")
//     telegramProfileId: string;

//     @OneToOne(
//         type => TelegramProfile,
//         tProfile => tProfile.bioData,
//         {
//             nullable: false,
//         }
//     )
//     @JoinColumn({
//         name: "telegramProfileId",
//         referencedColumnName: "id",
//     })
//     telegramProfile: TelegramProfile;

//     @IsString()
//     @Column("varchar", { length: urlMaxLength })
//     telegramFileId: string;

//     @Length(fileNameMinLength, fileNameMaxLength)
//     @IsString()
//     @Column({ length: fileNameMaxLength })
//     fileName: string;

//     @IsUrl()
//     @Column({ length: urlMaxLength })
//     url: string;

//     @Column("varchar", { length: mimeMaxLength })
//     mimeType: string;

//     @CreateDateColumn()
//     uploadedOn?: Date;

//     @DeleteDateColumn()
//     deletedOn?: Date;

//     // @Column()
//     // profileId: number;

//     // @ManyToOne(type => Profile, profile => profile.idProofs)
//     // profile: Profile;

//     // @OneToOne(type => IdMLValidation, pv => pv.profilePicture)
//     // idMLValidation: IdMLValidation;
// }

