import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsNumberString, Length, IsEmail, IsInt, IsOptional, Min, Max, IsPositive, IsUUID, IsNumber } from 'class-validator';
import { AnnualIncome, Gender, Religion } from 'src/common/enum';
import { nameMaxLength, nameMinLength } from 'src/common/field-length';

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
    // TODO: apply email validation
    @IsNotEmpty()
    @IsUUID(4)
    userId?: string;

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
}


export class PartnerPreferenceDto {

    @IsNotEmpty()
    @IsUUID(4)
    id: string;

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
