import { ParseArrayPipe } from "@nestjs/common";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsPositive, IsString, Length, Max, Min } from "class-validator";

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
    // stateIds?: number[]

    // @IsOptional()
    // @IsPositive({ each: true })
    // @IsInt({ each: true })
    // countryIds?: number[]
}