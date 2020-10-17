import {
    Entity,
    ObjectIdColumn,
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
} from 'typeorm';
import { IsEmail, IsString, Length } from 'class-validator';
import { Country } from './country.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @IsEmail()
    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    @Length(10, 10, { message: 'Phone number must be of 10 digits only!' })
    phone: string;
}