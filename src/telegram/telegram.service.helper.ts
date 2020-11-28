import { Logger } from '@nestjs/common';
import { assert } from 'console';
import { Context } from 'nestjs-telegraf';
import { AnnualIncome, annualIncomeString, EducationDegree, Religion } from 'src/common/enum';
import { deleteFile, doc2pdf, downloadFile, getHumanReadableDate, mimeTypes, toTitleCase, watermarkImage, watermarkPdf } from 'src/common/util';
import { Profile } from 'src/profile/entities/profile.entity';
import { bioCreateSuccessMsg, fatalErrorMsg, unsupportedBioFormat, unsupportedPictureFormat } from './telegram.constants';

const logger = new Logger('TelegramServiceHelper');

/**
 * file should not be more than
 * (2MBs = 2 * 1024 * 1024 = 2097152)
 * for some tolerance, use 2.1 MB = 2202009.6
 */
const fileSizeLimit = 2202009.6
const ONE_MB = 1048576; // 1024*1024

export function validateBioDataFileSize(ctx: Context) {
    logger.log(`-> validateBioDataFileSize(${ctx.message.document})`);
    const document = ctx.message.document;
    let errorMessage: string;

    if (document.file_size > fileSizeLimit) {
        const size = (document.file_size / ONE_MB).toFixed(2);
        errorMessage = `Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`;
    }
    return errorMessage;
}


export function validatePhotoFileSize(ctx: Context) {
    logger.log(`-> validatePhotoFileSize(${ctx.message.document}, ${ctx.message.photo})`);
    const document = ctx.message.document;
    const photo = ctx.message.photo?.length > 0 ? ctx.message.photo[0] : undefined;
    const file_size = photo ? photo.file_size : document.file_size;

    if (file_size > fileSizeLimit) {
        const size = (file_size / ONE_MB).toFixed(2);
        const errMessage = `Profile Picture should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce its size and resend using /upload_picture command.`;
        return errMessage;
    }
    return null;
}


export async function getBioDataFileName(ctx: Context):
    Promise<{
        fileName: string;
        link: string;
        errorMessage: string;
        quitOnError: boolean;
    }> {
    logger.log(`-> getBioDataFileName(${ctx.message.document}, ${ctx.wizard.state.data.telegramAccountId})`);

    const document = ctx.message.document;
    const telegramAccountId = ctx.wizard.state.data.telegramAccountId;

    assert(telegramAccountId, 'telegramAccountId cannot be null');

    let errorMessage: string;
    let link: string;
    let quitOnError: boolean;
    let fileName: string;

    if (document.mime_type === mimeTypes['.pdf']
        || document.mime_type === mimeTypes['.doc']
        || document.mime_type === mimeTypes['.docx']) {

        // ref - https://github.com/telegraf/telegraf/issues/277
        link = await ctx.telegram.getFileLink(document.file_id);
        logger.log(`bio download link: ${link}`);

        fileName = telegramAccountId + `_${Date.now().toString()}` + '_bio.';
        const nameParts = link.split('.');
        // console.log('nameParts', nameParts);

        let extension: string;
        let failure = true;
        if (nameParts.length > 2) {
            extension = nameParts.pop().toLocaleLowerCase();
            if (extension === 'pdf'
                || extension === 'doc'
                || extension === 'docx') {
                failure = false;
            }
        } else {
            extension = document.mime_type === mimeTypes['.pdf']
                ? document.mime_type === mimeTypes['.doc']
                    ? 'doc'
                    : 'docx'
                : null
            if (extension) {
                failure = false;
            }
        }
        if (failure) {
            logger.error(`Could not figure out extension for the bio-data.`);
            errorMessage = fatalErrorMsg;
            quitOnError = true;
        } else {
            fileName = fileName + extension;
            logger.log(`fileName: ${fileName}`);
        }

    }
    else { // unsupported mime type
        errorMessage = unsupportedBioFormat;
        quitOnError = false;
    }
    return {
        fileName,
        link,
        errorMessage,
        quitOnError
    };
}


export async function processBioDataFile(link: string, fileName: string, dir: string, convertToPdf = false, watermark = false): Promise<string | undefined> {

    logger.log(`-> processBioDataFile(${link}, ${fileName}, ${dir}, ${convertToPdf}, ${watermark})`);

    await downloadFile(link, fileName, dir);
    if (convertToPdf && !fileName.endsWith('.pdf')) {

        const originalFileName = fileName;
        fileName = await doc2pdf(fileName, dir);

        const extension = fileName.split('.').pop();
        logger.log(`converted ${extension} file to pdf!`);

        await deleteFile(originalFileName, dir);
    }

    if (watermark && fileName.endsWith('.pdf')) {
        fileName = await watermarkPdf(fileName, dir);
        logger.log('water marked file!');
    }
    return fileName;
}


export async function getPictureFileName(ctx: Context): Promise<{
    fileName: string;
    link: string;
    errorMessage: string;
    quitOnError: boolean;
}> {
    logger.log(`-> getPictureFileName(${ctx.message.document}, ${ctx.update.message.photo}, ${ctx.wizard.state.data.telegramAccountId})`);

    const photos = ctx.update.message.photo;
    // if photo is shared by photo sharing option.
    const photo = (photos && photos[0]) ? photos[0] : null;
    const document = ctx.message.document;
    const telegramAccountId = ctx.wizard.state.data.telegramAccountId;

    assert(telegramAccountId, 'telegramAccountId cannot be null');

    let fileName: string;
    let errorMessage: string
    let quitOnError: boolean;
    const link = await ctx.telegram.getFileLink(document ? document.file_id : photo.file_id);
    logger.log('picture download link:', link);

    if (document) {
        const mime_type = document.mime_type;
        logger.log('picture is in document, mime_type: ' + mime_type);
        if (mime_type !== mimeTypes['.jpg']
            && mime_type !== mimeTypes['.png']) {
            return {
                fileName,
                link: null,
                errorMessage: unsupportedPictureFormat,
                quitOnError: false
            }
        }
    }

    fileName = telegramAccountId + `_${Date.now().toString()}` + '_picture.'
    const nameParts: Array<string> = link.split('.');
    let extension: string;
    let failure = true;
    if (nameParts.length > 2) {
        extension = nameParts.pop().toLocaleLowerCase();
        if (extension === 'jpg'
            || extension === 'jpeg'
            || extension === 'png') {
            failure = false;
        }
    } else {
        if (document) {
            const mime_type = document.mime_type;
            if (mime_type === mimeTypes['.jpg'])
                extension = 'jpg'
            else if (mime_type === mimeTypes['.png'])
                extension = 'png'
            else
                failure = false;
        }
    }
    if (failure) {
        logger.error(`Could not figure out extension for the profile picture.`);
        errorMessage = fatalErrorMsg;
        quitOnError = true;
    } else {
        fileName = fileName + extension;
        logger.log(`fileName: ${fileName}`);
    }

    return {
        fileName,
        link,
        errorMessage,
        quitOnError
    };

}


export async function processPictureFile(link: string, fileName: string, watermark = false, dir: string): Promise<string | undefined> {
    logger.log(`-> processPictureFile(${link}, ${fileName}, ${watermark}, ${dir})`);

    await downloadFile(link, fileName, dir);
    if (watermark) {
        await watermarkImage(fileName, dir);
        logger.log('water marked picture!');
    }
    return fileName;
}


export function silentSend(): boolean {
    logger.log(`-> silentSend()`);
    let silent = false;
    const now = new Date();
    // silent notifications before 8 am and after 9:59 pm
    if (now.getHours() < 8 || now.getHours() > 21) {
        silent = true;
    }
    logger.log(`now: ${now}, silent: ${silent}`);
    return silent;
}


export function createProfileCard(profile: Profile): string {
    logger.log(`-> createProfileCard(${JSON.stringify(profile)})`);

    if (!profile?.city?.state?.country) {
        throw new Error('No state & country information found in profile city');
    }

    assert(profile.religion === profile.caste.religion);

    const religion = toTitleCase(Religion[profile.religion]);
    const education = toTitleCase(EducationDegree[profile.highestDegree]);
    const annualIncome = annualIncomeString[AnnualIncome[profile.annualIncome]];

    // DoB: ${ getHumanReadableDate(profile.dob) }
    const card = `${profile.name}\n` +
        `DoB: ${profile.dob.toString()}\n` +
        `Caste: ${profile.caste.name}, ${religion}\n` +
        `City: ${profile.city.name}, ${profile.city.state.name}, ${profile.city.state.country.iso3}\n` +
        `Education: ${education} \n` +
        `Income: ${annualIncome} per annum`;

    return card;

}