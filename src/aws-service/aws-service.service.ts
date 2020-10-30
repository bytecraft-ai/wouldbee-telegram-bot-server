import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotAcceptableException } from '@nestjs/common';
import { get } from 'config'
import { S3, SES, SNS, config, Credentials } from 'aws-sdk';
import { TypeOfDocument } from 'src/common/enum';
import { S3SignedUrl } from './aws-service.interface';
import { SendEmailDto } from './aws-service.dto';

// var AWS = require('aws-sdk');
var path = require('path');
var fs = require('fs');

const awsConfig = get('aws');
const logger = new Logger('AwsService');
// const downloadDir = '/tmp/'

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


    validateFileNameForS3Upload(fileName: string, typeOfDocument: TypeOfDocument, id: string): boolean {

        if (!fileName.includes(id)) {
            logger.log(`fileName: ${fileName}, id: ${id}`);
            throw new Error('fileName does not contain the id');
        }

        if (fileName.includes('_bio')) {
            return typeOfDocument === TypeOfDocument.BIO_DATA;
        }
        else if (fileName.includes('_id')) {
            return typeOfDocument === TypeOfDocument.ID_PROOF;
        }
        else if (fileName.includes('_picture')) {
            return typeOfDocument === TypeOfDocument.PICTURE;
        }
        // else if (fileName.includes('_video')) {
        //     typeOfDocument = TypeOfDocument.VIDEO;
        // }
        else {
            throw new BadRequestException(`unsupported typeOfDocument input: ${typeOfDocument}!`);
        }
    }


    async createSignedURL(id: string, fileName: string, typeOfDocument: TypeOfDocument, getTruePutFalse: boolean): Promise<S3SignedUrl | undefined> {

        this.validateFileNameForS3Upload(fileName, typeOfDocument, id);

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


    async uploadFileToS3(id: string, fileName: string, contentType: string, typeOfDocument: TypeOfDocument, dir = '/tmp/'): Promise<string | undefined> {

        logger.log(`Uploading files to the bucket. Params: ${id}, ${fileName}, ${contentType}, ${typeOfDocument}, ${dir}`);

        this.validateFileNameForS3Upload(fileName, typeOfDocument, id);
        const S3_BUCKET = this.getS3Bucket(typeOfDocument);
        const fileContent = fs.readFileSync(path.join(dir, fileName));

        // Setting up S3 upload parameters
        const params = {
            Bucket: S3_BUCKET,
            Key: fileName,
            Body: fileContent,
            ContentType: contentType
        };

        logger.log(`Read fileContent, bucket - ${S3_BUCKET}`);

        let url: string;

        // Uploading files to the bucket
        return new Promise((resolve, reject) => {
            this.awsS3.upload(params, (err, data) => {
                if (err) {
                    console.log(`Could not upload file: ${path.join(dir, fileName)} to S3, error:`, err);
                    reject(err);
                }
                url = data.Location;
                console.log(`File: ${fileName} uploaded successfully. ${data.Location}`);
                resolve(url);
            });
        });
    }


    // TODO: test
    async downloadFileFromS3(fileName: string, typeOfDocument: TypeOfDocument, dir = '/tmp/'): Promise<string> {
        const S3_BUCKET = this.getS3Bucket(typeOfDocument);
        var params = {
            Bucket: S3_BUCKET,
            Key: fileName
        };
        const readStream = this.awsS3.getObject(params).createReadStream();
        const writeStream = fs.createWriteStream(path.join(dir, fileName));
        readStream.pipe(writeStream);
        return path.join(dir, fileName);
    }


    // TODO: test
    async deleteFileFromS3(fileName: string, typeOfDocument: TypeOfDocument) {
        const S3_BUCKET = this.getS3Bucket(typeOfDocument);
        var params = {
            Bucket: S3_BUCKET,
            Key: fileName
        };
        return new Promise((resolve, reject) => {
            this.awsS3.deleteObject(params, function (err, data) {
                if (err) {
                    logger.log(`Could not delete aws file: ${fileName}. Error: ${err}`);
                    reject(err);
                }
                else {
                    logger.log(`Successfully deleted ${fileName} from bucket`);
                }
                logger.log(data);
                resolve();
            });
        });
    }


}
