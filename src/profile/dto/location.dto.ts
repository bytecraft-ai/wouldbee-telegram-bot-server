import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length, Max, MaxLength, Min } from "class-validator";
import { DocRejectionReason, ReasonForProfileBan } from 'src/common/enum';
import { cityMaxLength, cityMinLength, countryMaxLength, countryMinLength, docRejectionReasonMaxLength, stateMaxLength, stateMinLength } from "src/common/field-length";
import { getEnumValues } from "src/common/util";
import { PaginationDto } from "./profile.dto";


export class GetCountriesDto extends PaginationDto {
    @IsOptional()
    @Length(countryMinLength, countryMaxLength)
    @IsString()
    like?: string;

    @IsOptional()
    @Max(300)
    @Min(1)
    @IsInt()
    @Transform(value => Number(value))
    take?: number = 300;
}


export class GetStatesDto extends PaginationDto {
    @IsOptional()
    @Length(stateMinLength, stateMaxLength)
    @IsString()
    like?: string;

    // @IsOptional()
    // @IsPositive({ each: true })
    // @IsInt({ each: true })
    // // @Transform(values => values.map(value => Number(value)))  // doesn't work
    // // @Type(() => Number[])   // also doesn't work
    // @Type(() => Number)        // this also doesn't work
    // countryIds?: number[]
}


export class GetCitiesDto extends PaginationDto {
    @IsOptional()
    @Length(cityMinLength, cityMaxLength)
    @IsString()
    like?: string;
}