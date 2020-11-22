import { BadRequestException } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumberString, Length, IsEmail, IsInt, IsOptional, Min, Max, IsPositive, IsUUID, IsNumber, IsIn, IsBoolean, MaxLength } from 'class-validator';
import { AnnualIncome, EducationDegree, EmployedIn, Gender, MaritalStatus, Occupation, Religion, SupportTicketCategory, Language, ReasonForProfileBan, DocRejectionReason } from 'src/common/enum';
import { nameMaxLength, nameMinLength, supportResolutionMinLength, supportResolutionMaxLength, docRejectionReasonMaxLength } from 'src/common/field-length';
import { getEnumValues } from 'src/common/util';


export class PaginationDto {
    @IsOptional()
    @Min(0)
    @IsInt()
    @Transform(value => Number(value))
    skip?: number = 0;

    @IsOptional()
    @Max(20)
    @Min(1)
    @IsInt()
    @Transform(value => Number(value))
    take?: number = 20;
}


export class GetProfileDto {
    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    getPreference?: boolean;
}


export class GetTelegramAccountDto { //extends GetProfileDto {
    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    getProfile?: boolean;
}


export class GetTelegramAccountsDto extends PaginationDto {
    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    isNew?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    isUpdated?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    getProfile?: boolean;

    //// NOT WORKING
    // @IsOptional()
    // @IsBoolean()
    // @Transform(value => {
    //     if (value === 'true' || value === true) return true;
    //     else if (value === 'false' || value === false) return false;
    //     else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    // })
    // getPreference?: boolean;
}


export class DocumentTypeDto {
    @IsIn(['bio-data', 'picture', 'id-proof'])
    @IsString()
    documentType: string
}


export class BanProfileDto {
    @IsIn(getEnumValues(ReasonForProfileBan))
    @Transform(value => Number(value))
    reasonForBan: ReasonForProfileBan;

    @IsOptional()
    @MaxLength(docRejectionReasonMaxLength)
    @IsString()
    banDescription: string;
}


export class DocumentValidationDto {
    @IsUUID(4)
    documentId: string;

    @IsBoolean()
    // @Transform(value => Boolean(value))
    @Transform(value => {
        if (value === 'true' || value === true) return true;
        else if (value === 'false' || value === false) return false;
        else throw new BadRequestException(`${value} is not a boolean type! It's type is ${typeof value}`);
    })
    valid: boolean;

    @IsOptional()
    // @IsIn(Object.values(DocRejectionReason).filter(value => typeof value === 'number'))
    @IsIn(getEnumValues(DocRejectionReason))
    @Transform(value => Number(value))
    rejectionReason: DocRejectionReason;

    @IsOptional()
    @MaxLength(docRejectionReasonMaxLength)
    @IsString()
    rejectionDescription?: string;
}


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
    telegramAccountId: string;

    @IsNotEmpty()
    @Length(nameMinLength, nameMaxLength)
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsIn(getEnumValues(Gender))
    @IsInt()
    @Transform(value => Number(value))
    gender: Gender;

    @IsNotEmpty()
    @Transform(value => new Date(value))
    dob: Date;

    @IsNotEmpty()
    @IsIn(getEnumValues(Religion))
    @IsInt()
    @Transform(value => Number(value))
    religion: Religion;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    casteId: number;

    @IsNotEmpty()
    @IsIn(getEnumValues(AnnualIncome))
    @IsInt()
    @Transform(value => Number(value))
    annualIncome: AnnualIncome;

    @IsNotEmpty()
    @IsInt()
    @Transform(value => Number(value))
    cityId: number;

    // optional params

    @IsOptional()
    @IsIn(getEnumValues(EducationDegree))
    @IsInt()
    @Transform(value => Number(value))
    highestDegree?: EducationDegree;

    @IsOptional()
    @IsIn(getEnumValues(EmployedIn))
    @IsInt()
    @Transform(value => Number(value))
    employedIn?: EmployedIn;

    @IsOptional()
    @IsIn(getEnumValues(Occupation))
    @IsInt()
    @Transform(value => Number(value))
    occupation?: Occupation;

    @IsOptional()
    @IsIn(getEnumValues(Language))
    @IsInt()
    @Transform(value => Number(value))
    motherTongue?: Language;

    @IsOptional()
    @IsIn(getEnumValues(MaritalStatus))
    @IsInt()
    @Transform(value => Number(value))
    maritalStatus?: MaritalStatus;
}


export class PartnerPreferenceDto {

    @IsNotEmpty()
    @IsUUID(4)
    id: string;

    // TODO: fix - IsOptional() should allow null but it is not.
    @IsOptional()
    @Min(18)
    @Max(100)
    @IsInt()
    @Transform(value => Number(value))
    minAge?: number;

    // TODO: fix - IsOptional() should allow null but it is not.
    @IsOptional()
    @Min(21)
    @Max(100)
    @IsInt()
    @Transform(value => Number(value))
    maxAge?: number;

    // TODO: fix - IsOptional() should allow null but it is not.
    @IsOptional()
    @IsIn(getEnumValues(AnnualIncome))
    @IsInt()
    @Transform(value => Number(value))
    minimumIncome?: AnnualIncome;

    // TODO: fix - IsOptional() should allow null but it is not.
    @IsOptional()
    @IsIn(getEnumValues(AnnualIncome))
    @IsInt()
    @Transform(value => Number(value))
    maximumIncome?: AnnualIncome;

    @Type(() => Number)
    @IsOptional()
    @IsIn(getEnumValues(Religion), { each: true })
    @IsInt({ each: true })
    religions?: Religion[];

    @Type(() => Number)
    @IsOptional()
    @IsIn(getEnumValues(MaritalStatus), { each: true })
    @IsInt({ each: true })
    maritalStatuses?: MaritalStatus[];

    @Type(() => Number)
    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    casteIds?: number[];

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    @Type(() => Number)
    cityIds?: number[];

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    @Type(() => Number)
    stateIds?: number[];

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    @Type(() => Number)
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
    @IsIn(Object.values(Religion).filter(value => typeof value === 'number'))
    @Transform(value => Number(value))
    religion: Religion;
}


export class SupportResolutionDto {
    @IsNotEmpty()
    @IsIn(Object.values(SupportTicketCategory).filter(value => typeof value === 'number'))
    @Transform(value => Number(value))
    category: SupportTicketCategory;

    @IsOptional()
    @Length(supportResolutionMinLength, supportResolutionMaxLength)
    @IsString()
    resolution: string;
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
