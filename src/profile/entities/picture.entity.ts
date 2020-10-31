import {
    Entity,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToOne,
    JoinColumn,
    DeleteDateColumn,
    PrimaryColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
// import { PictureMLValidation } from './picture-validation.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { IsBoolean, IsString, IsUrl, Length } from 'class-validator';
import { fileNameMaxLength, fileNameMinLength, mimeMaxLength, urlMaxLength } from 'src/common/field-length';
import { TelegramProfile } from './telegram-profile.entity';

// TODO: implement table indexing on important columns

@Entity()
export class ProfilePicture extends Verifiable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    telegramProfileId: string;

    @OneToOne(
        type => TelegramProfile,
        tProfile => tProfile.bioData,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "telegramProfileId",
        referencedColumnName: "id",
    })
    telegramProfile: TelegramProfile;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column({ length: fileNameMaxLength })
    fileName: string;

    @IsUrl()
    @Column({ length: urlMaxLength })
    url: string;

    @Column("varchar", { length: mimeMaxLength })
    mimeType: string;

    // @IsBoolean()
    // @Column()
    // isDP: boolean; // Only one pic can be the display pic

    @CreateDateColumn()
    uploadedOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    // @Column({ "nullable": true, "default": () => null })
    // isReportedSpam: boolean;

    // @Column({ "nullable": true, "default": () => null })
    // reportedSpamOn: Date;

    // @OneToOne(type => PictureMLValidation, pv => pv.profilePicture)
    // pictureMLValidation: PictureMLValidation;
}

