import { IsBoolean, IsEmail, IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from "class-validator";

export class SendEmailDto {
    @IsOptional()
    @IsEmail()
    emailFrom?: string;

    @IsEmail()
    emailTo: string;

    @IsString()
    @Length(5, 50)
    subject: string;

    @IsString()
    @Length(25, 2000)
    body: string;

    @IsOptional()
    @IsBoolean()
    htmlType: boolean = false;
}


export class SendSmsDto {
    @IsOptional()
    @Length(1, 5)
    @IsNumberString()
    countryCode?: string = '91';

    @Length(4, 15)
    @IsNumberString()
    phone: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    subject: string = 'WouldBee';

    @IsString()
    @Length(10, 140)
    message: string;
}