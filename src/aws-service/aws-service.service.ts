import { Injectable, InternalServerErrorException, Logger, NotAcceptableException } from '@nestjs/common';
import { get } from 'config'
import { S3, SES, SNS, config, Credentials } from 'aws-sdk';
import { TypeOfDocument } from 'src/common/enum';
import { S3SignedUrl } from './aws-service.interface';
import { SendEmailDto } from './aws-service.dto';

const awsConfig = get('aws');
const logger = new Logger('AwsService');

@Injectable()
export class AwsService {

    // TODO: If using a single object leads to concurrency issues, create these objects every time they are required!
    private awsSnsObject: SNS
    private awsSesObject: SES
    private awsS3: S3

    constructor() {
        config.region = process.env.S3_REGION || awsConfig.S3_REGION;
        config.credentials = new Credentials(process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY)

        this.awsSnsObject = new SNS({
            apiVersion: '2010-03-31',
        })
        this.awsS3 = new S3();
        this.awsSesObject = new SES();
    }


    // ref - https://attacomsian.com/blog/amazon-ses-integration-nodejs/
    sendEmail(sendEmailDto: SendEmailDto): boolean {
        const { emailFrom, emailTo, subject, body, htmlType } = sendEmailDto;

        const bodyParam = htmlType
            ? {
                Html: {
                    Charset: 'UTF-8',
                    Data: body
                },
            } : {
                Text: {
                    Charset: "UTF-8",
                    Data: body
                }
            }

        const params = {
            Destination: {
                ToAddresses: [emailTo]
            },
            Message: {
                Body: bodyParam,
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            ReturnPath: emailFrom,
            Source: emailFrom,
        };

        this.awsSesObject.sendEmail(params, (err, data) => {
            if (err) {
                logger.warn(`Could not send email, error:`, err.stack);
                return false;
            } else {
                logger.log("Email sent:", JSON.stringify(data));
            }
        });
        return true;
    }


    // WARNING -- Very Costly!! do not use

    /* refs -
    * https://github.com/Sean-Bradley/AWS-SNS-SMS-with-NodeJS
    * https://stackoverflow.com/questions/38588923/how-to-send-sms-using-amazon-sns-from-a-aws-lambda-function
    */
    sendSMS(phoneNumber: string, countryCode: string, message: string, subject: string = 'WbSubject'): boolean {
        const params = {
            Message: message,
            Subject: subject,
            PhoneNumber: countryCode + phoneNumber,
            MessageAttributes: {
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'WouldBee'
                },
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional'
                },
            }
        };

        const publishTextPromise = this.awsSnsObject.publish(params).promise();

        publishTextPromise.then(
            function (data) {
                console.log('message sent:', data);
            }).catch(
                function (error) {
                    logger.warn(`Could not send SMS to: ${countryCode + phoneNumber}, Error:\n`, JSON.stringify(error));
                    return false;
                });

        return true;
    }


    getS3Bucket(typeOfDocument: TypeOfDocument): string {
        let S3_BUCKET: string;

        if (typeOfDocument === TypeOfDocument.PICTURE
            || typeOfDocument === TypeOfDocument.VIDEO) {
            S3_BUCKET = process.env.S3_BUCKET_PIC || awsConfig.S3_BUCKET_PIC;
        }
        else if (typeOfDocument === TypeOfDocument.ID_PROOF) {
            S3_BUCKET = process.env.S3_BUCKET_ID || awsConfig.S3_BUCKET_ID;
        }
        else if (typeOfDocument === TypeOfDocument.BIO_DATA) {
            S3_BUCKET = process.env.S3_BUCKET_BIO || awsConfig.S3_BUCKET_BIO;
        }
        else if (typeOfDocument === TypeOfDocument.REPORT_ATTACHMENT) {
            S3_BUCKET = process.env.S3_BUCKET_REPORT || awsConfig.S3_BUCKET_REPORT;
        }
        else {
            throw new NotAcceptableException('unsupported typeOfDocument!')
        }

        if (!S3_BUCKET) {
            throw new InternalServerErrorException(`Could not get the value of 'S3_BUCKET: (${S3_BUCKET})' env variable for "typeOfDocument: ${typeOfDocument}"`);
        }
        return S3_BUCKET;
    }


    async createSignedURL(publicId: string, fileName: string, typeOfDocument: TypeOfDocument,
        getTruePutFalse: boolean): Promise<S3SignedUrl | undefined> {

        // requires the following env variables
        // heroku config:set AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy
        // heroku config:set S3_BUCKET=bucket_name S3_REGION=region

        const S3_BUCKET = this.getS3Bucket(typeOfDocument);

        const s3Params = {
            Bucket: S3_BUCKET,
            Key: fileName,
            Expires: parseInt(process.env.S3_URL_EXPIRES_IN) || 30,  // 30 seconds
        };

        try {
            const urlObject = {
                url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
                preSignedUrl: await this.awsS3.getSignedUrlPromise(
                    getTruePutFalse ? 'getObject' : 'putObject',
                    s3Params)
            };
            return urlObject;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}
