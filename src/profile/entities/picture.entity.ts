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
import { fileNameMaxLength, fileNameMinLength, urlMaxLength } from 'src/common/field-length';

// TODO: implement table indexing on important columns

@Entity()
export class ProfilePicture extends Verifiable {
    // @PrimaryGeneratedColumn()
    // id: number;

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(
        type => Profile,
        profile => profile.picture,
        {
            // primary: true, 
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    profile: Profile;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column({ length: fileNameMaxLength })
    fileName: string;

    @IsUrl()
    @Column({ length: urlMaxLength })
    url: string;

    // @IsBoolean()
    // @Column()
    // isDP: boolean; // Only one pic can be the display pic

    @CreateDateColumn()
    uploadedOn: Date;

    // @Column({ "nullable": true, "default": () => null })
    // isReportedSpam: boolean;

    // @Column({ "nullable": true, "default": () => null })
    // reportedSpamOn: Date;

    // @OneToOne(type => PictureMLValidation, pv => pv.profilePicture)
    // pictureMLValidation: PictureMLValidation;

    @DeleteDateColumn()
    deletedOn?: Date;
}

