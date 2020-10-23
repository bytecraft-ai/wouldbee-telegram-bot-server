import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, IsNumberString, Length, IsEmail, IsIn } from 'class-validator';
import { UserRole } from 'src/common/enum';
import { nameMaxLength, nameMinLength, passwordMinLength, passwordMaxLength } from 'src/common/field-length';


export class AgentRegistrationDto {

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(10)
    @IsNumberString()
    phone: string;

    @IsNotEmpty()
    @Length(nameMinLength, nameMaxLength)
    @IsString()
    name: string;

    @IsNotEmpty()
    @Length(passwordMinLength, passwordMaxLength)
    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character" }
    )  // Strong pass, 1 up, 1 low, 1 number or special char
    password: string;

    @IsIn([UserRole.AGENT, UserRole.ADMIN])
    @Transform(value => Number(value))
    role: UserRole
}



export class AgentSignInDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(passwordMinLength, passwordMaxLength)
    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character" }
    )  // Strong pass, 1 up, 1 low, 1 number or special char
    password: string;
}


export class AgentChangePasswordDto {
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @Length(passwordMinLength, passwordMaxLength)
    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character" }
    )  // Strong pass, 1 up, 1 low, 1 number or special char
    oldPassword: string;

    @IsNotEmpty()
    @Length(passwordMinLength, passwordMaxLength)
    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
        { message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character" }
    )  // Strong pass, 1 up, 1 low, 1 number or special char
    newPassword: string;
}
