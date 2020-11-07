import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsNumberString, Length, IsEmail, IsInt, IsOptional, Min, Max, IsPositive, IsUUID, IsNumber, IsIn, IsDateString } from 'class-validator';
import { AnnualIncome, EducationDegree, EmployedIn, Gender, MaritalStatus, Occupation, Religion, TypeOfDocument, Language } from 'src/common/enum';
import { nameMaxLength, nameMinLength } from 'src/common/field-length';


export class RegistrationDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsPositive()
    @IsNumber()
    countryId: number;

    @IsNotEmpty()
    @Length(4, 15)
    @IsNumberString()
    phone: string;

    // profile

    @IsNotEmpty()
    @Length(nameMinLength, nameMaxLength)
    @IsString()
    name?: string;

    @IsNotEmpty()
    gender: Gender;

    @IsNotEmpty()
    dob?: Date;

    @IsNotEmpty()
    religion: Religion;

    @IsNotEmpty()
    @IsInt()
    casteId?: number;

    @IsNotEmpty()
    annualIncome?: AnnualIncome;

    @IsNotEmpty()
    cityId?: number;

    // preference

    @IsOptional()
    @Min(18)
    @Max(100)
    @IsInt()
    minAge?: number;

    @IsOptional()
    @Min(21)
    @Max(100)
    @IsInt()
    maxAge?: number;

    @IsOptional()
    religions?: Religion[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    casteIds?: number[];

    @IsOptional()
    minimumIncome?: AnnualIncome;

    @IsOptional()
    @IsPositive()
    @IsInt()
    cityIds?: number[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    stateIds?: number[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    countryIds?: number[];
}


export class CreateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsPositive()
    @IsNumber()
    countryId: number;

    @IsNotEmpty()
    @Length(4, 15)
    @IsNumberString()
    phone: string;
}


export class CreateProfileDto {
    @IsNotEmpty()
    @IsUUID(4)
    telegramProfileId: string;

    @IsNotEmpty()
    @Length(nameMinLength, nameMaxLength)
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    gender: Gender;

    @IsNotEmpty()
    @Transform(value => new Date(value))
    dob: Date;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    religion: Religion;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    casteId: number;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    annualIncome: AnnualIncome;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    cityId: number;

    // optional params

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    highestDegree?: EducationDegree;

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    employedIn?: EmployedIn;

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    occupation?: Occupation;

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    motherTongue?: Language;

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    maritalStatus?: MaritalStatus;
}


export class PartnerPreferenceDto {

    @IsNotEmpty()
    @IsUUID(4)
    id: string;

    @IsOptional()
    @Min(18)
    @Max(100)
    @IsInt()
    @Transform(value => Number(value))
    minAge?: number;

    @IsOptional()
    @Min(21)
    @Max(100)
    @IsInt()
    @Transform(value => Number(value))
    maxAge?: number;

    @IsOptional()
    religions?: Religion[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    casteIds?: number[];

    @IsOptional()
    @IsInt()
    @Transform(value => Number(value))
    minimumIncome?: AnnualIncome;

    @IsOptional()
    @IsPositive()
    @IsInt()
    cityIds?: number[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    stateIds?: number[];

    @IsOptional()
    @IsPositive()
    @IsInt()
    countryIds?: number[];
}


export class FileUploadDto {
    @IsNotEmpty()
    @IsUUID(4)
    userId: string;

    @IsIn(['bio', 'id'])
    @IsString()
    fileType: string;

    @IsNotEmpty()
    @Length(32, 200)
    fileName: string;
}


export class CreateCasteDto {
    @IsNotEmpty()
    @Length(2, 50)
    @IsString()
    casteName: string;

    @IsNotEmpty()
    @Max(Religion.SIKH)
    @Min(Religion.HINDU)
    @IsInt()
    @Transform(value => Number(value))
    religion: Religion;
}

   // // TODO: apply strong password validation
    // @IsNotEmpty()
    // @IsString()
    // @Length(8, 12)
    // // @Matches(
    // //   /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    // //   {message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character"}
    // //   )  // Strong pass, 1 up, 1 low, 1 number or special char
    // password: string;

// export class SignInDto {
//     // TODO: apply email validation
//     @IsNotEmpty()
//     @IsEmail()
//     email: string;

//     // TODO: apply strong password validation
//     @IsNotEmpty()
//     @IsString()
//     @Length(8, 12)
//     // @Matches(
//     //   /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
//     //   {message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character"}
//     //   )
//     password: string;
// }


// export class ChangePasswordDto {
//     // TODO: apply email validation
//     // @IsNotEmpty()
//     // @IsEmail()
//     // email: string;

//     // TODO: apply strong password validation
//     @IsNotEmpty()
//     @IsString()
//     @Length(8, 12)
//     // @Matches(
//     //   /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
//     //   {message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character"}
//     //   )
//     oldPassword: string;

//     // TODO: apply strong password validation
//     @IsNotEmpty()
//     @IsString()
//     @Length(8, 12)
//     // @Matches(
//     //   /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
//     //   {message: "Password should have at least 1 upper-case, 1 lower-case, and 1 number or special character"}
//     //   )
//     newPassword: string;
// }
