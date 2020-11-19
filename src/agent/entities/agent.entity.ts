import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';
import { IsEmail, IsNumber, IsNumberString, IsPositive, IsString, Length } from 'class-validator';
import { UserRole } from 'src/common/enum';
import { hash } from 'bcryptjs';

@Entity()
export class WbAgent extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @CreateDateColumn()
    createdOn?: Date;

    @UpdateDateColumn()
    updatedOn?: Date;

    @Length(3, 100)
    @IsNumberString()
    @Column()
    name: string;

    @IsEmail()
    @Column({ unique: true, nullable: false })
    email: string;

    @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    @IsNumberString()
    @Column({ unique: true, nullable: false })
    phone: string;

    @IsString()
    @Column()
    password: string;

    @IsString()
    @Column()
    salt: string;

    @Column("smallint")
    role: UserRole;

    async validatePassword(password: string): Promise<boolean> {
        const hashed_password = await hash(password, this.salt);
        return hashed_password === this.password;
    }
}