import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, Length, Max, MaxLength, Min } from "class-validator";
import { DocRejectionReason, ReasonForProfileBan } from 'src/common/enum';
import { docRejectionReasonMaxLength } from "src/common/field-length";
import { getEnumValues } from "src/common/util";


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