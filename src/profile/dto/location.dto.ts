// import { ParseArrayPipe } from "@nestjs/common";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length, Max, MaxLength, Min } from "class-validator";
import { DocRejectionReason, ReasonForProfileBan } from 'src/common/enum';
import { docRejectionReasonMaxLength } from "src/common/field-length";
import { getEnumValues } from "src/common/util";

export class PaginationDto {
    @IsOptional()
    @Max(20)
    @Min(1)
    @IsInt()
    @Transform(value => Number(value))
    take?: number = 20;

    @IsOptional()
    @Min(0)
    @IsInt()
    @Transform(value => Number(value))
    skip?: number = 0;
}


export class GetTelegramProfilesDto extends PaginationDto {
    @IsOptional()
    @IsBoolean()
    isValid?: boolean
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
    @IsInt()
    @Transform(value => Number(value))
    documentId: number;

    @IsBoolean()
    @Transform(value => Boolean(value))
    valid: boolean;

    @IsOptional()
    // @IsIn(Object.values(DocRejectionReason).filter(value => typeof value === 'number'))
    @IsIn(getEnumValues(DocRejectionReason))
    @Transform(value => Number(value))
    rejectionReason: DocRejectionReason;

    @IsOptional()
    @MaxLength(docRejectionReasonMaxLength)
    @IsString()
    rejectionDescription: string;

    // @IsOptional()
    // @IsIn(['bio-data', 'picture', 'id-proof'])
    // @IsString()
    // documentType?: string
}


export class GetCountriesDto {
    @IsOptional()
    @Length(3, 100)
    @IsString()
    like?: string;

    @IsOptional()
    @Max(300)
    @Min(1)
    @IsInt()
    @Transform(value => Number(value))
    take?: number = 247;

    @IsOptional()
    @Min(0)
    @IsInt()
    @Transform(value => Number(value))
    skip?: number = 0;
}


export class GetStatesDto {
    @IsOptional()
    @Length(3, 100)
    @IsString()
    like?: string;

    @IsOptional()
    @Max(20)
    @Min(1)
    @IsInt()
    @Transform(value => Number(value))
    take?: number = 20;

    @IsOptional()
    @Min(0)
    @IsInt()
    @Transform(value => Number(value))
    skip?: number = 0;

    // @IsOptional()
    // @IsPositive({ each: true })
    // @IsInt({ each: true })
    // // @Transform(values => values.map(value => Number(value)))  // doesn't work
    // // @Type(() => Number[])   // also doesn't work
    // @Type(() => Number)        // this also doesn't work
    // countryIds?: number[]
}


export class GetCitiesDto {
    @IsOptional()
    @Length(3, 100)
    @IsString()
    like?: string;

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

    // @IsOptional()
    // @IsPositive({ each: true })
    // @IsInt({ each: true })
    // stateIds?: number[]

    // @IsOptional()
    // @IsPositive({ each: true })
    // @IsInt({ each: true })
    // countryIds?: number[]
}