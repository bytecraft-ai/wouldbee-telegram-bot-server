import { Logger } from '@nestjs/common';
import {
    Start,
    Help,
    On,
    Hears,
    Context,
    InjectBot,
    TelegrafProvider,
    Composer,
    Markup,
    WizardScene,
    session,
    Stage,
    BaseScene,
    Command,
} from 'nestjs-telegraf';
import { TypeOfDocument } from 'src/common/enum';
import { deleteFile, doc2pdf, downloadFile, mimeTypes, watermarkFile } from 'src/common/util';
import { bioCreateSuccessMsg, fatalErrorMsg, unsupportedBioFormat, unsupportedPictureFormat } from './telegram.constants';

const logger = new Logger('TelegramServiceHelper');


export function validateBioDataFileSize(ctx: Context) {
    const document = ctx.message.document;
    let errorMessage: string;
    /**
     * file should not be more than
     * (2MBs = 2 * 1024 * 1024 = 2097152)
     * for some tolerance, use 2.1 MB = 2202009.6
     */
    if (document.file_size > 2202009.6) {
        const size = (document.file_size / 1048576).toFixed(2);
        errorMessage = `Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`;
    }
    return errorMessage;
}


export function validatePhotoFileSize(ctx: Context) {
    const document = ctx.message.document;
    const photo = ctx.message.photo?.length > 0 ? ctx.message.photo[0] : undefined;
    const file_size = photo ? photo.file_size : document.file_size;

    /**
     * file size should not be more than
     * (2MBs = 2 * 1024 * 1024 = 2097152)
     * for some tolerance, use 2.1 MB = 2202009.6
     */
    if (file_size > 2202009.6) {
        const size = (file_size / 1048576).toFixed(2);
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
    const document = ctx.message.document;
    const telegramProfileId = ctx.wizard.state.data.telegramProfileId;

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

        fileName = telegramProfileId + `_${Date.now().toString()}` + '_bio.'
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


export async function processBioDataFile(link: string, fileName: string, process = false, DIR: string = '/tmp/'): Promise<string | undefined> {

    await downloadFile(link, fileName, DIR);
    if (process) {
        if (!fileName.endsWith('.pdf')) {
            const originalFileName = fileName;
            fileName = await doc2pdf(fileName, DIR);

            const extension = fileName.split('.').pop();
            logger.log(`converted ${extension} file to pdf!`);

            await deleteFile(originalFileName, DIR);
        }

        await watermarkFile(fileName, DIR);
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
    const photos = ctx.update.message.photo;
    // if photo is shared by photo sharing option.
    const photo = (photos && photos[0]) ? photos[0] : null;
    const document = ctx.message.document;
    const telegramProfileId = ctx.wizard.state.data.telegramProfileId;

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

    fileName = telegramProfileId + `_${Date.now().toString()}` + '_picture.'
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


export async function processPictureFile(link: string, fileName: string, watermark = false, DIR: string = '/tmp/'): Promise<string | undefined> {
    await downloadFile(link, fileName, DIR);
    if (watermark) {
        await watermarkFile(fileName, DIR);
        logger.log('water marked picture!');
    }
    return fileName;
}