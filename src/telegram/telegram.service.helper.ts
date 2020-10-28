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
import { mimeType } from 'src/common/util';

const logger = new Logger('TelegramServiceHelper');


export function validateBioDataFileSize(ctx: Context) {
    const document = ctx.message.document;
    /**
     * file should not be more than
     * (2MBs = 2 * 1024 * 1024 = 2097152)
     * for some tolerance, use 2.1 MB = 2202009.6
     */
    if (document.file_size > 2202009.6) {
        const size = (ctx.message.document.file_size / 1048576).toFixed(2);
        const errMessage = `Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`;
        return errMessage;
    }
    return null;
}


export function validatePhotoFileSize(ctx: Context) {
    const document = ctx.message.document;
    const photo = ctx.message.photo?.length > 0 ? ctx.message.photo[0] : undefined;
    /**
     * file should not be more than
     * (2MBs = 2 * 1024 * 1024 = 2097152)
     * for some tolerance, use 2.1 MB = 2202009.6
     */
    if (document.file_size > 2202009.6) {
        const size = (ctx.message.document.file_size / 1048576).toFixed(2);
        const errMessage = `Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`;
        return errMessage;
    }
    return null;
}


export async function validateBioDataMimeType(ctx: Context) {
    const document = ctx.message.document;


}


export async function getBioDataFileName(ctx: Context) {
    const document = ctx.message.document;
    const telegramProfileId = ctx.wizard.state.data.telegramProfileId;

    let errorMessage: string = null;

    if (document.mime_type === mimeType['.pdf']
        || document.mime_type === mimeType['.doc']
        || document.mime_type === mimeType['.docx']) {

        // ref - https://github.com/telegraf/telegraf/issues/277
        const link = await ctx.telegram.getFileLink(document.file_id);
        logger.log(`bio download link: ${link}`);

        let fileName = telegramProfileId + '_bio.'
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
            extension = document.mime_type === mimeType['.pdf']
                ? document.mime_type === mimeType['.doc']
                    ? 'doc'
                    : 'docx'
                : null
            if (extension) {
                failure = false;
            }
        }
        if (failure) {
            logger.error(`Could not figure out extension for the bio-data. download link`);
            errorMessage = 'Some error occurred, please retry later.';
        } else {
            return [fileName + extension, null]
        }

    }
    else { // unsupported mime type
        errorMessage = 'Error: Only pdf or word files are supported for bio-data. Please retry with supported format or type "Cancel" to quit.'
    }
    return [null, errorMessage];
}


export async function getPictureFileName(ctx: Context) {
    const document = ctx.message.document;
    const telegramProfileId = ctx.wizard.state.data.telegramProfileId;

    const link = await ctx.telegram.getFileLink(document.file_id);
    console.log('picture download link:', link);

    let fileName = telegramProfileId + '_picture.'
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
    }
}