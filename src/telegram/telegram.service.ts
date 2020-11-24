/**
 * TODO:
 *  1. Use payload to implement referrals and tracking (if a user is 
 *      given the link by another user, an agent, or website)
 * 
 *  3. Test sharing of bio-data with user
 * 
 *  5. Implement thumbnails for bio-data
 * 
 *  6. Notify user on profile deletion.
 * 
 *  7. Implement rate-limiter
 * 
 *  8. Handle bots
 * 
 *  9. Fix Bug - Registration asking for bio again, when after saving bio, 
 *              registration is cancelled and then restarted.
 * 
 */

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { assert } from 'console';
import {
    Start,
    Help,
    On,
    Hears,
    Context,
    InjectBot,
    TelegrafProvider,
    WizardScene,
    session,
    Stage,
    Command,
    Action,
    // Use,
} from 'nestjs-telegraf';
import { RegistrationActionRequired, TypeOfDocument, DocRejectionReason, UserStatus, ProfileDeactivationDuration, ProfileDeletionReason } from 'src/common/enum';
import { deleteFile, mimeTypes } from 'src/common/util';
import { Profile } from 'src/profile/entities/profile.entity';
import { TelegramAccount } from 'src/profile/entities/telegram-account.entity';
import { ProfileService } from 'src/profile/profile.service';
import { welcomeMessage, helpMessage, bioCreateSuccessMsg, askForBioUploadMsg, pictureCreateSuccessMsg, registrationSuccessMsg, alreadyRegisteredMsg, fatalErrorMsg, unregisteredUserMsg, deactivatedProfileMsg, registrationCancelled, supportMsg, deletionSuccessMsg, acknowledgeDeletionRequest, unsupportedBioFormat, unverifiedProfileMsg } from './telegram.constants';
import { getBioDataFileName, getPictureFileName, processBioDataFile, processPictureFile, validateBioDataFileSize, validatePhotoFileSize, silentSend } from './telegram.service.helper';
import { Document } from 'src/profile/entities/document.entity';
import { supportResolutionMaxLength, supportResolutionMinLength } from 'src/common/field-length';
import telegrafThrottler from 'telegraf-throttler';
import { html as format } from 'telegram-format';
// import { Logger } from "nestjs-pino";
import { Logger as defaultLogger } from '@nestjs/common';


const logger = new defaultLogger('TelegramService');

const DIR = '/tmp/'; // dir to use for file downloads and processing
const applyWatermark = true;
const processToPdf = true;

@Injectable()
export class TelegramService {

    constructor(
        // private readonly logger: Logger,

        // @InjectQueue('scheduler-queue') private schedulerQueue: Queue,
        @InjectBot() private bot: TelegrafProvider,

        @Inject(forwardRef(() => ProfileService))
        private readonly profileService: ProfileService
    ) {

        /**
         * Ref - https://github.com/KnightNiwrem/telegraf-throttler#readme
         * use throttle to prevent flood of incoming messages & to comply with telegram *  api on speed of outgoing messages
         */
        const throttler = telegrafThrottler();
        this.bot.use(throttler);

        // set session middleware - required for creating wizard
        this.bot.use(session());

        this.createRegistrationWizard();
        this.createUpdateBioWizard();
        this.createUpdatePictureWizard();

        // TODO - will enable once admin panel has support for this
        // this.createSupportWizard();

        // TODO: test
        this.bot.catch((err, ctx) => {
            logger.error('ERROR!')
            logger.error(`updateType: ${ctx.updateType}, Error:\n${JSON.stringify(err)}`);
            ctx.reply(fatalErrorMsg);
        })

        this.setCommands();
    }


    async setCommands() {
        await this.bot.telegram.setMyCommands([
            { command: 'start', description: 'See the welcome message' },
            { command: 'help', description: 'See the help menu' },
            { command: 'register', description: 'Register for a new Would Bee account' },
            { command: 'status', description: 'See your Wouldbee account status' },
            { command: 'update_bio', description: 'Update bio-data up to 5 times.' },
            { command: 'update_picture', description: 'Update profile picture up to 5 times.' },
            { command: 'deactivate', description: 'Temporarily Deactivate Profile' },
            { command: 'reactivate', description: 'Reactivate profile' },
            { command: 'delete', description: 'Delete profile' },
            { command: 'recover', description: 'Recover deleted profile within first week' },
            { command: 'support', description: 'Customer support' },
        ]);
    }


    async getTelegramAccount(ctx: Context) {
        logger.log(`-> getTelegramAccount(${ctx.from.id})`);
        let telegramAccount: TelegramAccount;
        try {
            telegramAccount = await this.profileService.getTelegramAccountByTelegramUserId(ctx.from.id, { throwOnFail: false });
        }
        catch (error) {
            logger.error(`Could not get telegram account. Context: ${ctx.from.id} \nERROR: ${JSON.stringify(error)}`);
            await ctx.reply(fatalErrorMsg);
            throw error;
        }
        return telegramAccount;
    }


    async getOrCreateTelegramAccount(ctx: Context, payload?: string) {
        logger.log(`-> getOrCreateTelegramAccount(${ctx.from.id}, ${payload})`);
        const createTelegramAccount = async (ctx: Context, payload: string): Promise<TelegramAccount> => {
            if (ctx.from.is_bot) {
                logger.warn(`A bot interacted with us. ctx: ${JSON.stringify(ctx.from)}`);
                // await ctx.reply('Bot interaction not implemented.');
                await ctx.reply('!');
            }

            if (payload) {
                // TODO: Check whose referral is this
                // 1 - another user
                // const referee = await this.profileService.getProfileById(payload, { throwOnFail: false });
                // if (referee) {
                //     // TODO: mark as referee
                //     logger.log(`referee: [${referee[0]}, ${referee[1]}]`);
                // }
            }

            const telegramAccount = await
                this.profileService.createTelegramAccount(ctx);
            return telegramAccount;
        }

        let telegramAccount = await this.getTelegramAccount(ctx);
        if (!telegramAccount) {
            telegramAccount = await createTelegramAccount(ctx, payload);
        }
        logger.log(`getOrCreateTelegramAccount() -> ${JSON.stringify(telegramAccount)}`);
        return telegramAccount;
    }


    async getRegistrationAction(ctx: Context, telegramAccount: TelegramAccount): Promise<RegistrationActionRequired | undefined> {
        logger.log(`-> getRegistrationAction(${ctx.from.id})`);
        try {
            return this.profileService.getRegistrationAction(telegramAccount.id);
        }
        catch (error) {
            logger.error(`Could not get required registration action!`);
            await ctx.reply(fatalErrorMsg);
            throw error;
        }
    }


    // ref - https://github.com/telegraf/telegraf/issues/810
    // ref - https://github.com/telegraf/telegraf/issues/705
    createRegistrationWizard() {
        logger.log(`-> createRegistrationWizard()`);
        const registrationWizard = new WizardScene(
            'registration-wizard',

            // Step-1 :: Ask for Phone number.
            async (ctx: Context) => {
                logger.log(`Step-1`);
                ctx.wizard.state.data = {};

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                let telegramAccount = await this.getOrCreateTelegramAccount(ctx);
                ctx.wizard.state.data.telegramAccountId = telegramAccount.id;

                const status: RegistrationActionRequired = await this.getRegistrationAction(ctx, telegramAccount);

                logger.log(`status: ${JSON.stringify(status)}`);
                ctx.wizard.state.data.status = status;

                if (ctx.wizard.state.data.status === RegistrationActionRequired.NONE) {
                    await ctx.reply(alreadyRegisteredMsg);
                    return ctx.scene.leave();

                } else if (ctx.wizard.state.data.status > RegistrationActionRequired.VERIFY_PHONE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-1`);
                    ctx.wizard.state.data.next_without_user_input = true;

                    // problem - wizard.next() does not work without user input
                    // solution ref - https://github.com/telegraf/telegraf/issues/566#issuecomment-443209798
                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);

                } else {
                    ctx.wizard.state.data.next_without_user_input = false;
                    await ctx.telegram.sendMessage(ctx.chat.id, 'Share your phone number by clicking the button below.', {
                        parse_mode: "Markdown",
                        reply_markup: {
                            one_time_keyboard: true,
                            keyboard: [
                                [{
                                    text: "Share Phone Number",
                                    request_contact: true
                                },
                                {
                                    text: "Cancel",
                                }],
                            ],
                            force_reply: true
                        }
                    });
                }
                logger.log('calling step-2')
                return ctx.wizard.next();

            },

            // Step-2 :: Read Phone number, update into telegram account
            async (ctx: Context) => {
                logger.log(`Step-2:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status > RegistrationActionRequired.VERIFY_PHONE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-2`);
                    ctx.wizard.state.data.next_without_user_input = true;
                } else {

                    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                    // console.log(ctx.update.message.contact, ctx.update);
                    const msg = ctx.update.message;
                    const contact = ctx.update.message.contact;

                    if (contact) {
                        // Check that contact is not an attached contact!
                        if (contact["vcard"]) {
                            await ctx.reply('Please share your phone number by clicking the button below. Do not type or attach a contact.')
                            // re-enter the scene
                            return;
                        } else {
                            logger.log(`Contact shared: First name: ${contact.first_name}, contact: ${contact.phone_number}, chat-id: ${msg.chat.id}, user-id: ${ctx.from.id}`);

                            try {
                                const telegramAccountId: string = ctx.wizard.state.data.telegramAccountId

                                const telegramAccount = await this.profileService.savePhoneNumberForTelegramUser(telegramAccountId, msg.contact.phone_number);

                                logger.log(`Saved Phone number for Telegram account with  id: ${telegramAccount.id}`);
                            }
                            catch (error) {
                                logger.error(`Could not save phone number for Telegram account. \nERROR: ${JSON.stringify(error)}`);
                                await ctx.reply(fatalErrorMsg);
                                return ctx.scene.leave();
                            }

                            await ctx.reply(`Thank you ${msg.contact.first_name} for sharing your phone number: ${msg.contact.phone_number}`);
                        }
                    }
                    else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply(registrationCancelled);
                        return ctx.scene.leave();
                    }
                    else {
                        if (ctx.wizard.state.data?.skipped) {
                            await ctx.reply(`Click the "Share Phone Number" button or the "Cancel" button!`);
                        }
                        else {
                            ctx.wizard.state.data.skipped = false;
                        }
                        return;
                    }
                }
                logger.log('calling step-3');
                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-3: Ask for Bio
            async (ctx: Context) => {
                logger.log(`Step-3:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status > RegistrationActionRequired.UPLOAD_BIO_AND_PICTURE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-3, calling step-4`);
                    ctx.wizard.state.data.next_without_user_input = true;

                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
                    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                    await ctx.reply(askForBioUploadMsg);
                }


                logger.log('calling step-4');
                return ctx.wizard.next();
            },

            // Step-4 :: download bio, upload to aws.
            async (ctx: Context) => {
                logger.log(`Step-4:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status > RegistrationActionRequired.UPLOAD_BIO_AND_PICTURE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-4, calling step-5`);
                    ctx.wizard.state.data.next_without_user_input = true;
                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {

                    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                    const document = ctx.message.document;
                    if (document) {

                        await ctx.reply('Please wait ...');
                        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                        // size check
                        const sizeErrorMessage = validateBioDataFileSize(ctx);
                        if (sizeErrorMessage) {
                            await ctx.reply(sizeErrorMessage);
                            return;
                        }

                        const { fileName, link, errorMessage, quitOnError } = await
                            getBioDataFileName(ctx);

                        if (fileName) {
                            const mime_type = processToPdf
                                ? mimeTypes['.pdf'] : document.mime_type
                            try {
                                const fileToUpload
                                    = await processBioDataFile(link, fileName, DIR, processToPdf, applyWatermark);

                                await this.profileService.uploadDocument(ctx.from.id, fileToUpload, DIR, mime_type, TypeOfDocument.BIO_DATA, document.file_id);

                                await deleteFile(fileToUpload, DIR);
                                await ctx.reply(bioCreateSuccessMsg);

                            } catch (error) {
                                logger.error(`Could not download/upload the bio-data.  \nERROR: ${JSON.stringify(error)}`);
                                await ctx.reply(fatalErrorMsg);
                                return ctx.scene.leave();
                            }
                        } else {
                            assert(!!errorMessage, 'Both fileName and errorMessage cannot be null/undefined');
                            await ctx.reply(errorMessage);
                            if (quitOnError) {
                                return ctx.scene.leave();
                            } else {
                                return;
                            }
                        }
                    } else if (ctx.message.text?.toLocaleLowerCase() === '/cancel') {
                        await ctx.reply(registrationCancelled);
                        return ctx.scene.leave();
                    }
                    else {
                        if (ctx.wizard.state.data?.next_without_user_input) {
                            ctx.wizard.state.data.next_without_user_input = false;
                        } else {
                            if (ctx.update.message?.photo?.length) {
                                await ctx.reply(unsupportedBioFormat);
                            } else {
                                await ctx.reply(`Send bio-data or use /cancel to quit the registration process!`);
                            }
                        }
                        return;
                    }
                }
                logger.log('calling step-5');
                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-5 :: Ask for picture.
            async (ctx: Context) => {
                logger.log(`Step-5:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status > RegistrationActionRequired.UPLOAD_PICTURE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-5`);
                    ctx.wizard.state.data.next_without_user_input = true;
                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
                    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                    await ctx.reply(`Upload your profile picture (in PNG/JPG/JPEG format only) or use /cancel to quit.`);
                }

                logger.log('calling step-6');
                return ctx.wizard.next();
                // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-6 :: download picture, upload to aws, and finish.
            async (ctx: Context) => {
                logger.log(`Step-6:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status > RegistrationActionRequired.UPLOAD_PICTURE) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-6, leaving wizard!`);

                } else {

                    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                    logger.log(`picture registration - ${JSON.stringify(ctx.update.message)}`);
                    const photos = ctx.update.message.photo;
                    const document = ctx.message.document;
                    const photo = (photos && photos[0]) ? photos[0] : null;

                    if (document || photo) {

                        await ctx.reply('Please wait ...');
                        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                        // size check
                        const sizeErrorMessage = validatePhotoFileSize(ctx);
                        if (sizeErrorMessage) {
                            await ctx.reply(sizeErrorMessage);
                            return;
                        }

                        const file_id = photo ? photo.file_id : document.file_id

                        const { fileName, link, errorMessage, quitOnError } = await
                            getPictureFileName(ctx);

                        if (fileName) {
                            const extension = fileName.split('.').pop();
                            const mime_type = extension === 'jpg' || extension === 'jpeg'
                                ? mimeTypes['.jpg'] : mimeTypes['.png'];

                            try {
                                const fileToUpload
                                    = await processPictureFile(link, fileName, applyWatermark, DIR);

                                await this.profileService.uploadDocument(ctx.from.id, fileToUpload, DIR, mime_type, TypeOfDocument.PICTURE, file_id);

                                await deleteFile(fileToUpload, DIR);
                                await ctx.reply(pictureCreateSuccessMsg);

                            } catch (error) {
                                logger.error(`Could not download/upload the picture.  \nERROR: ${JSON.stringify(error)}`);
                                await ctx.reply(fatalErrorMsg);
                                return ctx.scene.leave();
                            }
                        } else {
                            assert(!!errorMessage, 'Both fileName and errorMessage cannot be null/undefined');
                            await ctx.reply(errorMessage);

                            if (quitOnError) {
                                return ctx.scene.leave();
                            } else {
                                return;
                            }
                        }
                    }
                    else if (ctx.message.text?.toLocaleLowerCase() === '/cancel') {
                        await ctx.reply(registrationCancelled);
                        return ctx.scene.leave();
                    }
                    else {
                        if (ctx.wizard.state.data.next_without_user_input) {
                            ctx.wizard.state.data.next_without_user_input = false;
                        } else {
                            await ctx.reply(`Send profile picture or use /cancel to quit the registration process! Note that only accepted formats are PNG, JPG, and JPEG.`);
                        }
                        return;
                    }
                    await ctx.reply(registrationSuccessMsg);
                }
                return ctx.scene.leave();
            }
        );
        const stage = new Stage([registrationWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('register', ctx => {
            ctx.scene.enter('registration-wizard');
        });
    }


    createUpdateBioWizard() {
        logger.log(`-> createUpdateBioWizard()`);
        const bioWizard = new WizardScene(
            'bio-wizard',

            // Step -1
            async (ctx: Context) => {
                ctx.wizard.state.data = {};
                logger.log(`createUpdateBioWizard:: step-1`);

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                const telegramAccount = await this.getOrCreateTelegramAccount(ctx);

                if (telegramAccount.status < UserStatus.UNVERIFIED) {
                    await ctx.reply(unregisteredUserMsg);
                    return ctx.scene.leave();
                } else if (telegramAccount.status === UserStatus.UNVERIFIED) {
                    await ctx.reply(unverifiedProfileMsg);
                    return ctx.scene.leave();
                } else if (telegramAccount.status > UserStatus.ACTIVATED) {
                    await ctx.reply(deactivatedProfileMsg);
                    return ctx.scene.leave();
                } else {
                    assert(telegramAccount.status > UserStatus.UNVERIFIED,
                        ctx.wizard.state.data.telegramAccountId = telegramAccount.id);
                }



                await ctx.reply(askForBioUploadMsg);

                logger.log('calling step-2');
                return ctx.wizard.next();

            },

            // step-2: download bio, watermark, upload to aws, delete from tmp
            async (ctx: Context) => {
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                logger.log(`createUpdateBioWizard:: step-2`);

                const document = ctx.message.document;
                if (document) {
                    const sizeErrorMessage = validateBioDataFileSize(ctx);
                    if (sizeErrorMessage) {
                        await ctx.reply(sizeErrorMessage);
                        return;
                    }

                    const { fileName, link, errorMessage, quitOnError } = await
                        getBioDataFileName(ctx);

                    if (fileName) {
                        const mime_type = processToPdf
                            ? mimeTypes['.pdf'] : document.mime_type
                        try {
                            const fileToUpload
                                = await processBioDataFile(link, fileName, DIR, processToPdf, applyWatermark);

                            await this.profileService.uploadDocument(ctx.from.id, fileToUpload, DIR, mime_type, TypeOfDocument.BIO_DATA, document.file_id);

                            await deleteFile(fileToUpload, DIR);
                            await ctx.reply(bioCreateSuccessMsg);
                            return ctx.scene.leave();

                        } catch (error) {
                            logger.error(`Could not download/upload the bio-data.  \nERROR: ${JSON.stringify(error)}`);
                            await ctx.reply(fatalErrorMsg);
                            return ctx.scene.leave();
                        }
                    } else {
                        assert(!!errorMessage, 'Both fileName and errorMessage cannot be null/undefined');
                        await ctx.reply(errorMessage);
                        if (quitOnError) {
                            return ctx.scene.leave();
                        } else {
                            return;
                        }
                    }
                } else if (ctx.message.text?.toLocaleLowerCase() === '/cancel') {
                    await ctx.reply('Cancelled');
                    return ctx.scene.leave();
                }
                else {
                    if (ctx.update.message?.photo?.length) {
                        await ctx.reply(unsupportedBioFormat);
                    } else {
                        await ctx.reply(`Send bio-data or use /cancel to quit the registration process!`);
                    }
                    return;
                }
            }
        );

        const stage = new Stage([bioWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('update_bio', ctx => {
            ctx.scene.enter('bio-wizard');
        });
    }


    createUpdatePictureWizard() {
        logger.log(`-> createUpdatePictureWizard()`);
        const pictureWizard = new WizardScene(
            'picture-wizard',

            // Step -1
            async (ctx: Context) => {
                ctx.wizard.state.data = {};
                logger.log('createUpdatePictureWizard():: step-1');

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                const telegramAccount = await this.getOrCreateTelegramAccount(ctx);

                if (telegramAccount.status < UserStatus.UNVERIFIED) {
                    await ctx.reply(unregisteredUserMsg);
                    return ctx.scene.leave();
                } else if (telegramAccount.status === UserStatus.UNVERIFIED) {
                    await ctx.reply(unverifiedProfileMsg);
                    return ctx.scene.leave();
                } else if (telegramAccount.status > UserStatus.ACTIVATED) {
                    await ctx.reply(deactivatedProfileMsg);
                    return ctx.scene.leave();
                } else {
                    assert(telegramAccount.status > UserStatus.UNVERIFIED, telegramAccount.status < UserStatus.DEACTIVATED);
                    ctx.wizard.state.data.telegramAccountId = telegramAccount.id;
                }

                await ctx.reply(`Upload your Profile picture or use /cancel to quit.`);

                logger.log('calling step-2');
                return ctx.wizard.next();
            },

            // step-2
            async (ctx: Context) => {
                logger.log('createUpdatePictureWizard():: step-2');
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                const photos = ctx.update.message.photo;
                const document = ctx.message.document;
                const photo = (photos && photos[0]) ? photos[0] : null;

                if (document || photo) {

                    // size check
                    const sizeErrorMessage = validatePhotoFileSize(ctx);
                    if (sizeErrorMessage) {
                        await ctx.reply(sizeErrorMessage);
                        return;
                    }

                    const { fileName, link, errorMessage, quitOnError } = await
                        getPictureFileName(ctx);

                    if (fileName) {
                        const file_id = photo ? photo.file_id : document.file_id

                        const extension = fileName.split('.').pop();
                        const mime_type = extension === 'jpg' || extension === 'jpeg'
                            ? mimeTypes['.jpg'] : mimeTypes['.png'];

                        try {
                            const fileToUpload
                                = await processPictureFile(link, fileName, applyWatermark, DIR);

                            await this.profileService.uploadDocument(ctx.from.id, fileToUpload, DIR, mime_type, TypeOfDocument.PICTURE, file_id);

                            await deleteFile(fileToUpload, DIR);
                            await ctx.reply(pictureCreateSuccessMsg);
                            return ctx.scene.leave();

                        } catch (error) {
                            logger.error(`Could not download/upload the picture.  \nERROR: ${JSON.stringify(error)}`);
                            await ctx.reply(fatalErrorMsg);
                            return ctx.scene.leave();
                        }
                    } else {
                        assert(!!errorMessage, 'Both fileName and errorMessage cannot be null/undefined');
                        await ctx.reply(errorMessage);

                        if (quitOnError) {
                            return ctx.scene.leave();
                        } else {
                            return;
                        }
                    }
                }
                else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply('Cancelled');
                    return ctx.scene.leave();
                }
                else {
                    await ctx.reply(`Send profile picture or use /cancel to quit the registration process!`);
                    return;
                }
            });

        const stage = new Stage([pictureWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('update_picture', ctx => {
            ctx.scene.enter('picture-wizard');
        });
    }


    createSupportWizard() {
        logger.log(`-> createSupportWizard()`);

        const supportWizard = new WizardScene(
            'support-wizard',

            // Step -1
            async (ctx: Context) => {
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                ctx.wizard.state.data = {};
                logger.log(`createSupportWizard():: step-1`);

                let telegramAccount = await this.getOrCreateTelegramAccount(ctx);
                ctx.wizard.state.data.telegramAccountId = telegramAccount.id;

                await ctx.reply(supportMsg);

                logger.log('calling step-2');
                return ctx.wizard.next();
            },

            // step-2: read query/feedback, upload to table
            async (ctx: Context) => {
                logger.log(`createSupportWizard():: step-2`);
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                if (ctx.message.text) {
                    const msg = ctx.message.text;

                    if (msg.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply('Cancelled');
                        return ctx.scene.leave();
                    }

                    if (msg.length < supportResolutionMinLength || msg.length > supportResolutionMaxLength) {
                        await ctx.reply(`Please try again while keeping the query/feedback length between ${supportResolutionMinLength} to ${supportResolutionMaxLength} characters.`)
                        return;
                    }

                    try {
                        const ticket = await this.profileService.createSupportTicket(ctx.wizard.state.data.telegramAccountId, msg.toLocaleLowerCase());
                        await ctx.reply(`Your query/feedback has been saved. We will get back to you in a few days.`);
                    } catch (error) {
                        logger.log(`Could not open new support ticket. \nERROR: ${JSON.stringify(error)}`);

                        // TODO: Confirm that this is actually a conflict error
                        await ctx.reply('You have already opened one support ticket. Cannot open another until that is resolved or closed from your end.');

                        return ctx.scene.leave();
                    }

                }
                else {
                    await ctx.reply(`Type your query/feedback or use /cancel to quit.`);
                    return;
                }
            }
        );

        const stage = new Stage([supportWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('support', ctx => {
            ctx.scene.enter('support-wizard');
        });
    }


    @Start()
    async start(ctx: Context) {
        logger.log(`-> start(${ctx.from.id})`);

        const msg = ctx.message;

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply(welcomeMessage);

        let payload: string;

        const msgList = msg.text.split(' ');
        if (msgList.length === 2) {
            payload = msgList[1];
            logger.log('payload:', payload)
        }
        await this.getOrCreateTelegramAccount(ctx, payload);
    }


    @Help()
    async help(ctx: Context) {
        logger.log(`-> help(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply(helpMessage);
    }


    @Command('delete')
    async delete(ctx: Context) {
        logger.log(`-> delete(${ctx.from.id})`);

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramAccount = await this.getOrCreateTelegramAccount(ctx);

        if (telegramAccount.status < UserStatus.UNVERIFIED) {
            await ctx.reply(`You are not registered! There's nothing to delete`);
        }
        else if (telegramAccount.status === UserStatus.BANNED) {
            // TODO: in terms and conditions, mention that we will not delete banned profiles.
            await ctx.reply('Your profile was banned and automatically deleted.');
        }
        else if (telegramAccount.status === UserStatus.PENDING_DELETION) {
            await ctx.reply('Your profile has already been marked for deletion!');
        }
        else {
            const inlineKeyboardButtons = [[{ text: 'Cancel', callback_data: `delete-0` }]];

            // global replacement using regex. ref - https://www.w3schools.com/jsref/jsref_replace.asp
            for (let i = 1; i <= ProfileDeletionReason.Other; i++) {
                inlineKeyboardButtons.push([{ text: ProfileDeletionReason[i].replace(/_/g, ' '), callback_data: `delete-${i}` }]);
            }

            await ctx.telegram.sendMessage(ctx.chat.id, acknowledgeDeletionRequest, {
                reply_markup: {
                    inline_keyboard: inlineKeyboardButtons
                }
            });
        }
    }


    // delete callback function
    @Action(/delete-(10|[0-9])/)
    async delete_callback(ctx: Context) {
        logger.log(`-> delete_callback(${ctx.from.id}) \n callback-data: ${ctx.callbackQuery.data}`);

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.deleteMessage();

        const callbackData = parseInt(ctx.callbackQuery.data.split('-')[1]);

        if (callbackData === 0) {
            await ctx.reply('Cancelled');
        }
        else {
            try {
                await this.profileService.markProfileForDeletion(ctx.from.id, callbackData);
            } catch (error) {
                logger.error(`Could not mark profile for deletion. Context: ${JSON.stringify(ctx.from)} \nERROR: ${JSON.stringify(error)}`);
                await ctx.reply(fatalErrorMsg);
                return;
            }

            await ctx.reply(deletionSuccessMsg);
        }

    }


    @Command('recover')
    async recover(ctx: Context) {
        logger.log(`-> recover(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramAccount = await this.getTelegramAccount(ctx);

        if (telegramAccount.status === UserStatus.PENDING_DELETION) {
            await ctx.telegram.sendMessage(ctx.chat.id, acknowledgeDeletionRequest, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Confirm', callback_data: `recover-confirm` },
                            { text: 'Cancel', callback_data: `recover-cancel` }
                        ]
                    ]
                }
            });
        }
        else {
            await ctx.reply('Your profile has already been marked for deletion!');
        }
    }


    @Action(/recover-(confirm|cancel)/)
    async recover_callback(ctx: Context) {
        logger.log(`-> recover_callback(${ctx.from.id}) \n callback-data: ${ctx.callbackQuery.data}`);

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        if (ctx.callbackQuery.data === 'recover-confirm') {
            try {
                await this.profileService.cancelProfileForDeletion(ctx.from.id);
                await ctx.reply('Your profile deletion has been canceled.');
            }
            catch (error) {
                logger.error(`Could not recover profile. Context: ${JSON.stringify(ctx.from)} \nERROR: ${JSON.stringify(error)}`);
                await ctx.reply(fatalErrorMsg);
                return;
            }
        } else {
            await ctx.reply('Cancelled');
        }
    }


    @Command('deactivate')
    async deactivate(ctx: Context) {
        logger.log(`-> deactivate(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramAccount = await this.getOrCreateTelegramAccount(ctx);
        if (telegramAccount.status === UserStatus.ACTIVATED) {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Okay. For how long do you want to deactivate?', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Cancel', callback_data: "deactivate-0" }],
                        [
                            { text: '1 week', callback_data: "deactivate-1" },
                            { text: '2 weeks', callback_data: "deactivate-2" }
                        ],
                        [
                            { text: '1 month', callback_data: "deactivate-3" },
                            { text: '2 months', callback_data: "deactivate-4" }
                        ]
                    ]
                }
            });
        } else {
            await ctx.reply('Only Active profiles can be deactivated. Use the /help command to see how to interact with Would Bee bot.');
        }
    }


    // deactivate callback handler
    @Action(/deactivate-[0-4]/)
    async deactivation_callback(ctx: Context) {
        logger.log(`-> deactivation_callback(${ctx.from.id}) \n callback-data: ${ctx.callbackQuery.data}`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.deleteMessage();

        const duration = parseInt(ctx.callbackQuery.data.split('-')[1]);

        if (duration === 0) {
            await ctx.reply('Cancelled');
        } else {
            try {
                const durationString = ProfileDeactivationDuration[duration];
                await this.profileService.deactivateProfile(ctx.from.id, duration);

                await ctx.reply(`Alright! Deactivated your profile for ${durationString.toLocaleLowerCase().replace(/_/g, ' ')}. Use /reactivate command to reactivate your profile anytime.`);
            }
            catch (error) {
                logger.error(`Could not deactivate profile. Context: ${JSON.stringify(ctx.from)} \nERROR: ${JSON.stringify(error)}`);
                await ctx.reply(fatalErrorMsg);
                return;
            }
        }
    }


    @Command('reactivate')
    async reactivate(ctx: Context) {
        logger.log(`-> reactivate(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramAccount = await this.getOrCreateTelegramAccount(ctx);
        if (telegramAccount.status === UserStatus.DEACTIVATED) {
            try {
                await this.profileService.reactivateProfile(telegramAccount.userId);
                await ctx.reply('Welcome back! Your profile has been reactivated successfully.');
            }
            catch (error) {
                logger.error(`Could not get reactivateProfile profile.`);
                await ctx.reply(fatalErrorMsg);
                return;
            }
        } else {
            ctx.reply('Only Deactivated profiles can be reactivated. Use the /help command to see how to interact with Would Bee bot.');
        }
    }


    // TODO: test
    @Command('status')
    async accountStatus(ctx: Context) {
        logger.log(`-> accountStatus(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramAccount = await this.getOrCreateTelegramAccount(ctx);

        let msg = '';
        switch (telegramAccount.status) {
            case UserStatus.UNREGISTERED:
            case UserStatus.PHONE_VERIFIED:
                msg = 'You are unregistered. Please create a profile using /register command.'
                break;

            case UserStatus.UNVERIFIED:
                msg = 'Your profile activation is pending at our end. We will verify your submitted bio-data and profile-picture shortly and notify you of the decision. No action is required from you.'
                break;

            case UserStatus.VERIFICATION_FAILED:
                msg = `Your profile activation failed.`
                try {
                    const causingDocument = await this.profileService.getInvalidatedDocumentCausingProfileInvalidation(telegramAccount.id);

                    if (causingDocument?.invalidationReason) {
                        msg += `\n Reason: ${causingDocument.invalidationReason}.`
                    }

                    if (causingDocument?.invalidationDescription) {
                        msg += `\n Description: ${causingDocument.invalidationDescription}`
                    }
                }
                catch (error) {
                    logger.error(`Could not get invalidation causing document.`);
                    await ctx.reply(fatalErrorMsg);
                }
                msg += `\n You need to re-register using /register command and submit your corrected bio-data and/or profile picture.`
                break;

            case UserStatus.VERIFIED:
                msg = 'Your bio-data and picture has been verified. Your profile will be activated shortly. No action is required from you.'
                break;

            case UserStatus.ACTIVATED:
                msg = 'Your profile has been activated. No action is required from you.'
                break;

            case UserStatus.DEACTIVATED:
                msg = 'Your profile is deactivated. In this state, you will neither receive any matches nor your profile with be shared with your matches. To reactivate it, use /reactivate command.'
                break;

            case UserStatus.PENDING_DELETION:
                msg = 'Your profile has been marked for deletion and will be deleted permanently & irrecoverably within a week. If you do not want it to be deleted, use /recover command.'
                break;

            case UserStatus.DELETED:
                msg = 'Your profile has been deleted. If you wish to create a new profile, use /register command.'
                break;

            case UserStatus.BANNED:
                msg = 'Your profile has been banned. If you think this is a mistake, contact our customer support.'
                break;

            default:
                msg = fatalErrorMsg;
                logger.error(`Could not determine status for Telegram account.`);
        }

        await ctx.reply(msg);
    }


    @Command('support')
    async support(ctx: Context) {
        logger.log(`-> support(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply(`Please email your issue to us on "support@wouldbee.com" and we will try our best to help you out.`)
    }


    @Command('preference')
    async preference(ctx: Context) {
        logger.log(`-> preference(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('This feature will be released soon.')
    }


    @Command('preview')
    async preview(ctx: Context) {
        logger.log(`-> preview(${ctx.from.id})`);
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('This feature will be released soon.')
    }


    // fails silently
    async notifyUser(telegramAccount: TelegramAccount, message: string, sendHi = true) {
        logger.log(`-> notifyUser(${telegramAccount.id}, ${message}, ${sendHi})`);
        try {
            const chatId = telegramAccount.chatId;
            if (sendHi) {
                const name = telegramAccount.name || 'there';
                message = `Hi ${name},\n${message}`;
            }
            await this.bot.telegram.sendMessage(chatId, message,
                { disable_notification: silentSend() });
        }
        catch (error) {
            logger.error(`Could not notify user. Telegram account id: ${JSON.stringify(telegramAccount.id)}, message: ${message}, name: ${name}, ERROR:\n${JSON.stringify(error)}`);
        }
    }


    async notifyUserOfVerification(telegramAccount: TelegramAccount, doc: Document, result: boolean, invalidationReason?: DocRejectionReason, invalidationDescription?: string) {
        logger.log(`-> notifyUserOfVerification(${telegramAccount.id}, ${doc.id}, ${invalidationReason}, ${invalidationDescription})`);

        const chatId = telegramAccount.chatId;
        const docType: string = TypeOfDocument[doc.typeOfDocument].toLowerCase();
        const reason: string = !!invalidationReason ? DocRejectionReason[invalidationReason].replace(/_/g, ' ') : null;
        let message: string;

        const name = telegramAccount.name || 'there';
        message = `Hi ${name},\n`;

        if (result) {
            message += `Your ${docType} has successfully been verified.`;
        } else {
            message += `Your ${docType} has been rejected.`;

            if (reason) {
                // message += format.bold(reason);
                message += `\nReason: ${reason}`;
            } else {
                message += '.';
            }

            if (invalidationDescription) {
                // message += `\nComments from verification team: ${format.italic(invalidationDescription)}\n`;
                message += `\nAdditional comments: ${invalidationDescription}\n`;
            }

            message += `You can upload a new ${docType} or if you think that is a mistake, please contact our customer care.`;
        }

        // TODO - fix formatting.
        // await this.bot.telegram.sendMessage(chatId, format.escape(message), { parse_mode: "HTML" });
        await this.bot.telegram.sendMessage(chatId, message,
            { disable_notification: silentSend() });
    }


    async sendProfile(sendToTelegramAccount: TelegramAccount, profileToSend: Profile, TelegramAccountToSend: TelegramAccount,) {
        logger.log(`-> sendProfile(${sendToTelegramAccount.id}, ${profileToSend.id}, ${TelegramAccountToSend.id})`);

        const chatId = sendToTelegramAccount.chatId;
        const photoFileId = TelegramAccountToSend.picture.telegramFileId;
        const bioFileId = TelegramAccountToSend.bioData.telegramFileId;

        await this.bot.telegram.sendMessage(chatId, `Hi.Here's a new match for you.\nName: ${profileToSend.name}\nDoB: ${profileToSend.dob}`,
            { disable_notification: silentSend() });

        await this.bot.telegram.sendPhoto(chatId, photoFileId, {
            caption: profileToSend.name,
            disable_notification: silentSend()
        });

        await this.bot.telegram.sendDocument(chatId, bioFileId, {
            caption: profileToSend.name,
            disable_notification: silentSend()
        });
    }



    @On(['voice', 'audio', 'document', 'photo', 'sticker', 'animation', 'video'])
    onUnsupportedCommand(ctx: Context) {
        logger.log(`-> onUnsupportedCommand(), type: ${ctx.updateType}, subType: ${ctx.updateSubTypes}`);
        ctx.reply('This is unsupported. Please use /help command to see what this bot supports.');
    }


    @Hears(['Hi', 'hi', 'Hey', 'hey', 'Hello', 'hello', 'Hola', 'hola', 'Namaskar', 'namaskar', 'Namaste', 'namaste'])
    onHey(ctx: Context) {
        logger.log(`-> onHey()`);
        ctx.reply(`Hi there. Create your profile and we'll assist you to talk to someone real.`);
    }

    @Hears(['Cancel', 'cancel'])
    onCancel(ctx: Context) {
        logger.log(`-> onCancel()`);
        ctx.reply(``);
    }

    @Hears(/.*/)
    allText(ctx: Context) {
        logger.log(`-> allText()`);
        ctx.reply('This is unsupported. Please use /help command to see what this bot supports.');
    }

}