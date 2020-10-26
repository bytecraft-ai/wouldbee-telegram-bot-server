import {
    Entity,
    Column,
    CreateDateColumn,
    OneToOne,
    PrimaryColumn,
    JoinColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { TypeOfIdProof } from 'src/common/enum'
import { Profile } from './profile.entity';
import { Verifiable } from './abstract-verifiable.entity';
import { IsString, IsUrl, Length } from 'class-validator';
import { fileNameMaxLength, fileNameMinLength, urlMaxLength } from 'src/common/field-length';

// TODO: implement table indexing on important columns

@Entity()
export class IdProof extends Verifiable {

    // @PrimaryColumn("int")
    // id: number

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @OneToOne(
        type => Profile,
        profile => profile.idProof,
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

    // @Column("enum", { enum: TypeOfIdProof })
    @Column("smallint")
    type: TypeOfIdProof;

    @Length(fileNameMinLength, fileNameMaxLength)
    @IsString()
    @Column({ length: fileNameMaxLength })
    fileName: string;

    @IsUrl()
    @Column({ length: urlMaxLength })
    url: string;

    @CreateDateColumn()
    uploadedOn: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    // @Column()
    // profileId: number;

    // @ManyToOne(type => Profile, profile => profile.idProofs)
    // profile: Profile;

    // @OneToOne(type => IdMLValidation, pv => pv.profilePicture)
    // idMLValidation: IdMLValidation;
}

