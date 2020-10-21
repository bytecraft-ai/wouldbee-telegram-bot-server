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
    take?: number = 247;

    @IsOptional()
    @Min(0)
    @IsInt()
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
    take?: number = 20;

    @IsOptional()
    @Min(0)
    @IsInt()
    skip?: number = 0;

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    countryIds?: number[]
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
    take?: number = 20;

    @IsOptional()
    @Min(0)
    @IsInt()
    skip?: number = 0;

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    stateIds?: number[]

    @IsOptional()
    @IsPositive({ each: true })
    @IsInt({ each: true })
    countryIds?: number[]
}