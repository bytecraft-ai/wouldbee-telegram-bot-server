import { Body, Controller, Get, Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
// import { TypeOfDocument } from 'src/common/enum';
// import { SendEmailDto, SendSmsDto } from './aws-service.dto';
// import { Roles } from 'src/common/decorators/roles.decorator';
// import { UserRole } from 'src/common/enum';
// import { GqlJwtGuard } from 'src/common/guards/jwt.guard';
import { AwsService } from './aws-service.service';

const logger = new Logger('AwsServiceController');

@Controller('aws')
@UsePipes(ValidationPipe)
export class AwsServiceController {

    constructor(
        private awsServiceService: AwsService,
    ) { }


    // @Get('/sendOTP')
    // sendOTP(@Body() sendSmsDto: SendSmsDto) {
    //     return this.awsServiceService.sendSMS(sendSmsDto);
    // }


    // sendEmail(sendEmailDto: SendEmailDto) {
    //     return this.awsServiceService.sendEmail(sendEmailDto);
    // }

    // @Get('/upload')
    // upload() {
    // return this.awsServiceService.uploadFileToS3("abcdefghijklmopqrtuvwxyzabcdes", "biodatas/abcdefghijklmopqrtuvwxyzabcdes_bio.pdf", "application/pdf", TypeOfDocument.BIO_DATA)
    //     return;
    // }
}
