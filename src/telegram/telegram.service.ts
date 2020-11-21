/**
 * TODO:
 *  1. Use payload to implement referrals and tracking (if a user is 
 *      given the link by another user, an agent, or website)
 * 
 *  2. Implement status - what does a user need to do next
 * 
 *  3. Test sharing of bio-data with user
 * 
 *  5. Implement thumbnails for bio-data
 * 
 *  6. Notify user on bio/picture verification, profile deletion, reactivation.
 * 
 */

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { assert } from 'console';
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
    Action,
} from 'nestjs-telegraf';
import { RegistrationActionRequired, TypeOfDocument, DocRejectionReason, UserStatus, ProfileDeactivationDuration, ProfileDeletionReason } from 'src/common/enum';
import { deleteFile, mimeTypes } from 'src/common/util';
import { Profile } from 'src/profile/entities/profile.entity';
import { TelegramProfile } from 'src/profile/entities/telegram-profile.entity';
import { ProfileService } from 'src/profile/profile.service';
import { welcomeMessage, helpMessage, bioCreateSuccessMsg, askForBioUploadMsg, pictureCreateSuccessMsg, registrationSuccessMsg, alreadyRegisteredMsg, fatalErrorMsg, unregisteredUserMsg, registrationCancelled, supportMsg, deletionSuccessMsg, acknowledgeDeletionRequest } from './telegram.constants';
import { getBioDataFileName, getPictureFileName, processBioDataFile, processPictureFile, validateBioDataFileSize, validatePhotoFileSize, } from './telegram.service.helper';
import { Document } from 'src/profile/entities/document.entity';
import { supportResolutionMaxLength, supportResolutionMinLength } from 'src/common/field-length';

const logger = new Logger('TelegramService');

const DIR = '/tmp/'; // dir to use for file downloads and processing
const applyWatermark = true;
const processToPdf = true;

@Injectable()
export class TelegramService {

    constructor(
        // @InjectQueue('scheduler-queue') private schedulerQueue: Queue,
        @InjectBot() private bot: TelegrafProvider,

        @Inject(forwardRef(() => ProfileService))
        private readonly profileService: ProfileService
    ) {

        // set session middleware - required for creating wizard
        this.bot.use(session());

        this.createRegistrationWizard();
        this.createUploadBioWizard();
        this.createUploadPictureWizard();

        this.bot.catch((err, ctx) => {
            logger.error(`Bot encountered an error for updateType: ${ctx.updateType}, Error:\n${JSON.stringify(err)}`);
            ctx.reply(fatalErrorMsg);
        })

        // Handle all unsupported messages.
        // bot.on('message', ctx => ctx.reply('Please use /help command to see what this bot supports.'));
    }


    async createTelegramProfile(ctx: Context): Promise<TelegramProfile> {
        const telegramProfile = await
            this.profileService.createTelegramProfile(ctx.message.chat.id, ctx.from.id);
        logger.log(`Telegram profile created: ${JSON.stringify(telegramProfile)}`);
        return telegramProfile;
    }


    async getProfile(ctx: Context) {
        const telegramProfile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id, { throwOnFail: false });
        logger.log(`getProfile() - telegramProfile: ${JSON.stringify(telegramProfile)}`);
        return telegramProfile;
    }


    async getOrCreateProfile(ctx: Context) {
        let telegramProfile = await this.getProfile(ctx);
        if (!telegramProfile) {
            telegramProfile = await this.createTelegramProfile(ctx);
        }
        return telegramProfile;

        // let msg = '';

        // switch (telegramProfile.status) {
        //     case UserStatus.UNREGISTERED:
        //     case UserStatus.PHONE_VERIFIED:
        //         msg = 'You are unregistered. Please type or click on /register to register.'
        //         break;

        //     case UserStatus.ACTIVATION_PENDING:
        //         msg = 'Your profile activation is pending at our end. We will verify your submitted bio-data and profile-picture shortly and notify you of the decision.'
        //         break;

        //     case UserStatus.ACTIVATION_FAILED:
        //         msg = `Your profile activation failed.`
        //         const causingDocument = await this.profileService.getInvalidatedDocumentCausingProfileInvalidation(telegramProfile.id)
        //         if (causingDocument?.invalidationReason) {
        //             msg += `\n Reason - ${causingDocument.invalidationReason}.`
        //         }
        //         if (causingDocument?.invalidationDescription) {
        //             msg += `\n Description - ${causingDocument.invalidationDescription}`
        //         }
        //         break;

        //     case UserStatus.ACTIVATED:
        //         msg = 'Your profile is activated and requires no action from you.'
        //         break;

        //     case UserStatus.DEACTIVATED:
        //         msg = 'Your profile is deactivated. In this state, you will neither receive any matches nor your profile with be shared with your matches. To reactivate it, use /reactivate command.'
        //         break;

        //     case UserStatus.DELETED:
        //         msg = 'Your profile has been deleted.'
        //         break;

        //     case UserStatus.BANNED:
        //         msg = 'Your profile has been banned.'
        //         break;
        // }
        // await ctx.reply(msg);
    }


    async doesProfileExist(ctx: Context) {
        const telegramProfile = await this.getProfile(ctx);
        console.log(telegramProfile, !telegramProfile, !!telegramProfile);
        return !!telegramProfile;
    }


    // ref - https://github.com/telegraf/telegraf/issues/810
    // ref - https://github.com/telegraf/telegraf/issues/705
    createRegistrationWizard() {
        const registrationWizard = new WizardScene(
            'registration-wizard',

            // Step-1 :: Ask for Phone number.
            async (ctx: Context) => {
                logger.log(`Step-1`);
                ctx.wizard.state.data = {};

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                let telegramProfile = await this.getProfile(ctx);
                if (telegramProfile) {
                    ctx.wizard.state.data.telegramProfileId = telegramProfile.id;
                    const status: RegistrationActionRequired = await this.profileService.getRegistrationAction(telegramProfile.id);
                    logger.log(`status: ${JSON.stringify(status)}`);
                    ctx.wizard.state.data.status = status;
                } else {
                    ctx.wizard.state.data.telegramProfileId = (await this.createTelegramProfile(ctx)).id;
                    ctx.wizard.state.data.status = RegistrationActionRequired.VERIFY_PHONE;
                }

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

            // Step-2 :: Read Phone number, update into profile
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
                                const telegramProfileId: string = ctx.wizard.state.data.telegramProfileId

                                const telegramProfile = await this.profileService.savePhoneNumberForTelegramUser(telegramProfileId, msg.contact.phone_number);

                                logger.log(`Saved Phone number for Telegram Profile with  id: ${telegramProfile.id}`);
                            }
                            catch (error) {
                                logger.error('Could not save phone number for telegram profile. Error', error);
                                await ctx.reply("Some error occurred. Please try again later!");
                                return ctx.scene.leave();
                            }

                            await ctx.reply(`Thank you ${msg.contact.first_name} for sharing your phone number: ${msg.contact.phone_number}`);
                            // return;

                            // ctx.wizard.state.data.phone_number = ctx.update.message.contact.phone_number;
                        }
                    }
                    else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply(`Canceling registration!`);
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
                // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
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
                                logger.error("Could not download/upload the bio-data. Error:", error);
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
                    } else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply(registrationCancelled);
                        return ctx.scene.leave();
                    }
                    else {
                        if (ctx.wizard.state.data?.next_without_user_input) {
                            ctx.wizard.state.data.next_without_user_input = false;
                        } else {
                            await ctx.reply(`Send bio-data or type "Cancel" to quit the registration process!`);
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
                    await ctx.reply(`Upload your profile picture or type Cancel to quit.`);
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

                    console.log('picture registration:', ctx.update.message);
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
                                logger.error("Could not download/upload the picture. Error:", error);
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
                        await ctx.reply(registrationCancelled);
                        return ctx.scene.leave();
                    }
                    else {
                        if (ctx.wizard.state.data.next_without_user_input) {
                            ctx.wizard.state.data.next_without_user_input = false;
                        } else {
                            await ctx.reply(`Send profile picture or type "Cancel" to quit the registration process!`);
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


    createUploadBioWizard() {
        const bioWizard = new WizardScene(
            'bio-wizard',

            // Step -1
            async (ctx: Context) => {
                ctx.wizard.state.data = {};
                logger.log(`createUploadBioWizard():: step-1`);

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                const telegramProfile = await this.getProfile(ctx);

                if (!telegramProfile) {
                    await ctx.reply(unregisteredUserMsg);
                    return ctx.scene.leave();
                } else {
                    logger.log(`telegram profile: ${telegramProfile}`);
                    ctx.wizard.state.data.telegramProfileId = telegramProfile.id;
                }

                await ctx.reply(askForBioUploadMsg);

                logger.log('calling step-2');
                return ctx.wizard.next();

            },

            // step-2: download bio, watermark, upload to aws, delete from tmp
            async (ctx: Context) => {
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                logger.log(`createUploadBioWizard():: step-2`);

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
                            logger.error("Could not download/upload the bio-data. Error:", error);
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
                } else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply('Cancelled');
                    return ctx.scene.leave();
                }
                else {
                    await ctx.reply(`Send bio-data or type "Cancel" to quit the registration process!`);
                    return;
                }
            }
        );

        const stage = new Stage([bioWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('upload_bio', ctx => {
            ctx.scene.enter('bio-wizard');
        });
    }


    createUploadPictureWizard() {
        const pictureWizard = new WizardScene(
            'picture-wizard',

            // Step -1
            async (ctx: Context) => {
                ctx.wizard.state.data = {};
                logger.log('createUploadPictureWizard():: step-1');

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                const telegramProfile = await this.getProfile(ctx);

                if (!telegramProfile) {
                    await ctx.reply(unregisteredUserMsg);

                    return ctx.scene.leave();
                } else {
                    logger.log(`telegram profile: ${telegramProfile}`);
                    ctx.wizard.state.data.telegramProfileId = telegramProfile.id;
                }

                await ctx.reply(`Upload your Profile picture or type Cancel to quit.`);

                logger.log('calling step-2');
                return ctx.wizard.next();
            },

            // step-2
            async (ctx: Context) => {
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
                // console.log(ctx.update.message);
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
                            logger.error("Could not download/upload the picture. Error:", error);
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
                    await ctx.reply(`Send profile picture or type "Cancel" to quit the registration process!`);
                    return;
                }
            });

        const stage = new Stage([pictureWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('upload_picture', ctx => {
            ctx.scene.enter('picture-wizard');
        });
    }


    createSupportWizard() {
        const supportWizard = new WizardScene(
            'support-wizard',

            // Step -1
            async (ctx: Context) => {
                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                ctx.wizard.state.data = {};
                logger.log(`createSupportWizard():: step-1`);

                // check if the user has already been registered.
                let telegramProfile = await this.getProfile(ctx);

                if (!telegramProfile) {
                    telegramProfile = await this.createTelegramProfile(ctx);
                } else {
                    logger.log(`telegram profile: ${telegramProfile}`);
                }
                ctx.wizard.state.data.telegramProfileId = telegramProfile.id;

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
                        const ticket = await this.profileService.createSupportTicket(ctx.wizard.state.data.telegramProfileId, msg.toLocaleLowerCase());
                        await ctx.reply(`Your query/feedback has been saved. We will get back to you in a few days.`);
                    } catch (error) {
                        logger.log('Could not Open new support ticket due to the following error:\n' + JSON.stringify(error));

                        // TODO: Confirm that this is actually a conflict error
                        await ctx.reply('You have already opened one support ticket. Cannot open another until that is resolved or closed from your end.');
                    }

                }
                else {
                    await ctx.reply(`Type your query/feedback or type "Cancel" to quit.`);
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
        const msg = ctx.message;

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const exists = await this.doesProfileExist(ctx)
        if (exists) {
            await ctx.reply('Welcome back! Please use (click on or type) /help command to see how you can interact with me.')
            return;
        } else {
            let payload: string;

            const msgList = msg.text.split(' ');
            if (msgList.length === 2) {
                payload = msgList[1]

                logger.log('payload:', payload)
                // TODO: Check whose referral is this
                // 1 - another user
                const referee = await this.profileService.getProfile(payload, { throwOnFail: false });
                if (referee) {
                    // TODO: mark as referee
                    logger.log(`referee: [${referee[0]}, ${referee[1]}]`);
                }
            }
            await this.createTelegramProfile(ctx);
            await ctx.reply(welcomeMessage);
        }
    }


    @Help()
    async help(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply(helpMessage);
    }


    @Command('delete')
    async delete(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramProfile = await this.getProfile(ctx);

        // await this.profileService.markProfileForDeletion(ctx.from.id, );
        if (telegramProfile.status < UserStatus.ACTIVATION_PENDING) {
            await ctx.reply('Cannot delete unregistered profile.');
        }
        else if (telegramProfile.status === UserStatus.BANNED) {
            // TODO: in terms and conditions, mention that we will not delete banned profiles.
            await ctx.reply('Cannot delete banned profile.');
        }
        else if (telegramProfile.status === UserStatus.PENDING_DELETION) {
            await ctx.reply('Your profile has already been marked for deletion!');
        }
        else {

            const inlineKeyboardButtons = [{ text: 'Cancel', callback_data: `delete-0` }];
            for (let i = 1; i <= ProfileDeletionReason.Other; i++) {
                inlineKeyboardButtons.push({ text: ProfileDeletionReason[i].replace('_', ' '), callback_data: `delete-${i}` })
            }

            await ctx.telegram.sendMessage(ctx.chat.id, acknowledgeDeletionRequest, {
                reply_markup: {
                    inline_keyboard: [
                        inlineKeyboardButtons
                    ]
                }
            });
        }
    }


    // delete callback function
    @Action(/delete-[0-10]/)
    async delete_callback(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        logger.log(`delete_callback data: ${ctx.callbackQuery.data}`);
        await ctx.deleteMessage();

        const callbackData = parseInt(ctx.callbackQuery.data.split('-')[1]);

        if (callbackData === 0) {
            await ctx.reply('Cancelled');
        }
        else {
            await this.profileService.markProfileForDeletion(ctx.from.id, callbackData);
            await ctx.reply(deletionSuccessMsg);
        }

    }


    @Command('cancel-delete')
    async cancel_delete(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramProfile = await this.getProfile(ctx);

        if (telegramProfile.status === UserStatus.PENDING_DELETION) {
            await ctx.reply('Your profile has already been marked for deletion!');
        }
        else {

            await ctx.telegram.sendMessage(ctx.chat.id, acknowledgeDeletionRequest, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Confirm', callback_data: `cancel_delete-confirm` },
                            { text: 'Cancel', callback_data: `cancel_delete-cancel` }
                        ]
                    ]
                }
            });
        }
    }


    @Action(/cancel_delete-[confirm,cancel]/)
    async cancel_delete_callback(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        logger.log(`cancel_delete callback data: ${ctx.callbackQuery.data}`);

        if (ctx.callbackQuery.data === 'cancel_delete-confirm') {
            await this.profileService.cancelProfileForDeletion(ctx.from.id);
            await ctx.reply('Your profile deletion has been canceled.');
        } else {
            await ctx.reply('Cancelled');
        }
    }


    @Command('deactivate')
    async deactivate(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramProfile = await this.getOrCreateProfile(ctx);
        if (telegramProfile.status === UserStatus.ACTIVATED) {
            await ctx.telegram.sendMessage(ctx.chat.id, 'Okay. For how long do you want to deactivate?', {
                reply_markup: {
                    inline_keyboard: [
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
    @Action(/deactivate-[1,2,3,4]/)
    async deactivation_callback(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        logger.log(`deactivate data: ${ctx.callbackQuery.data}`);
        await ctx.deleteMessage();

        const duration = parseInt(ctx.callbackQuery.data.split('-')[1]);
        const durationString = ProfileDeactivationDuration[duration];

        try {
            await this.profileService.deactivateProfile(ctx.from.id, duration);

            await ctx.reply(`Alright! Deactivated your profile for ${durationString.toLocaleLowerCase().replace('_', ' ')}. Use /reactivate command to reactivate your profile anytime.`);
        }
        catch (error) {
            await ctx.reply(fatalErrorMsg);
        }
    }


    @Command('reactivate')
    async reactivate(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramProfile = await this.getOrCreateProfile(ctx);
        if (telegramProfile.status === UserStatus.DEACTIVATED) {
            try {
                await this.profileService.reactivateProfile(telegramProfile.telegramUserId);
                await ctx.reply('Welcome back! Your profile has been reactivated successfully.');
            }
            catch (error) {
                await ctx.reply(fatalErrorMsg);
            }
        } else {
            ctx.reply('Only Deactivated profiles can be reactivated. Use the /help command to see how to interact with Would Bee bot.');
        }
    }


    // TODO: test
    @Command('status')
    async status(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        const telegramProfile = await this.getOrCreateProfile(ctx);
        logger.log(`status:, ${telegramProfile.status}`);

        let msg = '';

        switch (telegramProfile.status) {
            case UserStatus.UNREGISTERED:
            case UserStatus.PHONE_VERIFIED:
                msg = 'You are unregistered. Please type or click on /register to register.'
                break;

            case UserStatus.ACTIVATION_PENDING:
                msg = 'Your profile activation is pending at our end. We will verify your submitted bio-data and profile-picture shortly and notify you of the decision.'
                break;

            case UserStatus.ACTIVATION_FAILED:
                msg = `Your profile activation failed.`
                const causingDocument = await this.profileService.getInvalidatedDocumentCausingProfileInvalidation(telegramProfile.id)
                if (causingDocument?.invalidationReason) {
                    msg += `\n Reason - ${causingDocument.invalidationReason}.`
                }
                if (causingDocument?.invalidationDescription) {
                    msg += `\n Description - ${causingDocument.invalidationDescription}`
                }
                break;

            case UserStatus.ACTIVATED:
                msg = 'Your profile is activated and requires no action from you.'
                break;

            case UserStatus.DEACTIVATED:
                msg = 'Your profile is deactivated. In this state, you will neither receive any matches nor your profile with be shared with your matches. To reactivate it, use /reactivate command.'
                break;

            case UserStatus.DELETED:
                msg = 'Your profile has been deleted.'
                break;

            case UserStatus.BANNED:
                msg = 'Your profile has been banned.'
                break;

            default:
                msg = fatalErrorMsg;
                logger.error(`Could not determine status for Telegram profile with id: ${telegramProfile.id}, telegram profile:\n${JSON.stringify(telegramProfile)}`);
        }

        await ctx.reply(msg);
    }


    @Hears('hello')
    @Hears('hi')
    @Hears('hey')
    async hears(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('Hi there! Type or click on /help to see how you can interact with me. ');
    }


    @Command('support')
    async support(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply(`Please email your issue to us on "support@wouldbee.com" and we will try our best to help you out.`)
    }


    @Command('feedback')
    @Command('delete_account')
    @Command('unsubscribe')
    @Command('subscribe')
    @Command('preference')
    @Command('my_profile')
    async feedback(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('This feature will be released soon.')
    }


    async notifyUserOfVerification(telegramProfile: TelegramProfile, doc: Document, result: boolean, invalidationReason?: DocRejectionReason, invalidationDescription?: string) {
        const chatId = telegramProfile.telegramChatId;
        const docType: string = TypeOfDocument[doc.typeOfDocument].toLowerCase();
        const reason: string = !!invalidationReason ? DocRejectionReason[invalidationReason].toLowerCase() : null;
        let message: string;

        if (result) {
            message = `Hi. Your ${docType} has successfully been verified.`
        } else {
            message = `Hi. Your ${docType} has been rejected`
            if (reason) {
                message += ` as it was found ${reason}.`
            } else {
                message += '.'
            }
            message += `You can upload a new ${docType} or ff you think that is a mistake, please contact our customer care.`
        }
        await this.bot.telegram.sendMessage(chatId, message);
    }


    async sendProfile(sendToTelegramProfile: TelegramProfile, profileToSend: Profile, TelegramProfileToSend: TelegramProfile,) {
        const chatId = sendToTelegramProfile.telegramChatId;
        const photoFileId = TelegramProfileToSend.picture.telegramFileId;
        const bioFileId = TelegramProfileToSend.bioData.telegramFileId;

        await this.bot.telegram.sendMessage(chatId, `Hi. Here's a new match for you.\nName: ${profileToSend.name}\nDoB: ${profileToSend.dob}`)

        await this.bot.telegram.sendPhoto(chatId, photoFileId, { caption: profileToSend.name });

        await this.bot.telegram.sendDocument(chatId, bioFileId, { caption: profileToSend.name });
    }


    @On('video')
    @On('animation')
    @On('sticker')
    @On('photo')
    @On('document')
    @On('audio')
    @On('voice')
    // @Hears('')
    onUnsupportedCommand(ctx: Context) {
        ctx.reply('Please use /help command to see what this bot supports.');
    }




    // @Command('upload_bio')
    // async uploadBio(ctx: Context) {

    //     // TODO: Set context for accepting bio-data with a 1 minute timeout in session

    //     await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

    //     await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your bio-data, preferably in PDF format. It should not be more than 2 MB in size. Don't include profile pictures in the bio-data. You can send profile picture separately using /upload_pic command. Note that it will be verified manually before being sent to prospective matches.`);
    // }


    // @On('document')
    // async onDocument(ctx: Context) {
    //     const document = ctx.message.document;
    //     console.log('document-upload:', ctx.update);

    //     await ctx.telegram.sendChatAction(ctx.message.chat.id, 'upload_document');

    //     const telegramProfile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id, {
    //         throwOnFail: false
    //     });
    //     if (!telegramProfile) {
    //         ctx.reply('Please verify your phone number first by using /start command.');
    //         return;
    //     }

    //     // file should not be more than 
    //     // (2MBs = 2 * 1024 * 1024 = 2097152)
    //     // for some tolerance, use 2.1 MB = 2202009.6
    //     if (document.file_size > 2202009.6) {
    //         const size = (ctx.message.document.file_size / 1048576).toFixed(2);
    //         ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend by giving /uploadbio command.`)

    //         return;
    //     }

    //     // TODO: Test doc file. docx works
    //     // file should be in one of - pdf, doc, or docx format
    //     if (document.mime_type === 'application/pdf' || document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {

    //         // ref - https://github.com/telegraf/telegraf/issues/277
    //         const link = await ctx.telegram.getFileLink(document.file_id);

    //         let fileName = telegramProfile.id + '_bio.';
    //         let extension: string = link.split('.')[-1];
    //         if (!extension ||
    //             (extension !== 'pdf'
    //                 && extension !== 'doc'
    //                 && extension !== 'docx')
    //         ) {
    //             extension = document.mime_type === 'application/pdf' ? 'pdf' : 'docx'
    //         }
    //         fileName = fileName + extension;
    //         console.log('fileName:', fileName);

    //         await downloadFile(link, fileName);

    //         await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.BIO_DATA, document.file_id);

    //         await ctx.reply(`Success! Your bio-data has been saved! You can update it anytime using the /uploadbio command.

    //         Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.

    //         Till then, you can set your match preferences. To see how, use the /help command.
    //         `);

    //         // TODO: Remove context for accepting bio-data.
    //         return;

    //     } else {
    //         await ctx.reply(`Only PDF and Word files are supported for Bio-data. Please try again with a PDF or Word file using /uploadbio command.`);

    //         return;
    //     }
    // }


    // @Command('upload_pic')
    // async uploadPicture(ctx: Context) {

    //     // TODO: Set context for accepting profile picture with a 1 minute timeout in session

    //     await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

    //     await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your Picture. It should clearly show your face and not be more than 5 MB in size. Your picture will be manually verified before being sent to prospective matches.`);
    // }


    // @On('photo')
    // async onPhoto(ctx: Context) {
    //     console.log('photo-upload:', ctx.update.message.photo);
    //     await ctx.reply(`Thanks!`);
    //     // return;

    //     // Choose the smallest picture to save
    //     const photo = ctx.update.message.photo[0];

    //     // photo should not be more than 1 MB)
    //     // for some tolerance, use 1.1 MB = 1152433.6
    //     if (photo.file_size > 1152433.6) {
    //         const size = (ctx.message.document.file_size / 1048576).toFixed(2);
    //         ctx.reply(`Photo should not be more than 5 MB in size. Please use a smaller sized photo and resend by giving /uploadpicture command.`)

    //         return;
    //     }

    //     // No need to handle GIFs as they come as documents

    //     const link = await ctx.telegram.getFileLink(photo.file_id);
    //     // console.log('link:', link);
    //     // const fileName = 'user-id.' + photo.mime_type === 'application/pdf' ? 'pdf' : 'doc'
    //     // await downloadFile(fileName, link);
    //     download_file_httpget(link, 'photo');

    //     await ctx.reply(`Success! Your Profile picture has been saved! It will be manually verified before it is sent to other members.`);
    // }


    // @Command('updates')
    // async sendBio(ctx: Context) {
    //     await ctx.telegram.sendChatAction(ctx.chat.id, 'upload_document');
    //     await ctx.telegram.sendMessage(ctx.message.chat.id, 'Sending a bio-data');
    //     const document = await ctx.telegram.sendDocument(
    //         ctx.message.chat.id,
    //         // option 1: use publicly accessible url
    //         // 'http://www.africau.edu/images/default/sample.pdf',

    //         // option 2: use file_id generated by telegram
    //         'BQACAgQAAxkDAAOGX5Jyq2s3oqkBfMGkR356U-VkPwUAAiMCAAKTWkVQthkVols1F6YbBA',

    //         // option 3: use file from source
    //         // {
    //         // url: 'http://www.africau.edu/images/default/sample.pdf',
    //         // source: 'biodatas/sample.docx',
    //         // filename: 'sample.docx'
    //         // },
    //         { caption: 'Match Score: 80%' }
    //     );
    //     console.log(document.document);
    // }


    // TODO
    // @Command('my_profile_picture')
    // async sendPhoto(ctx: Context) {
    //     await ctx.telegram.sendChatAction(ctx.chat.id, 'upload_photo');
    //     await ctx.telegram.sendPhoto(ctx.message.chat.id,
    //         // 'AgACAgUAAxkBAAOxX5Om1-bJ6u-jtMMdbWygyNZaQ_kAAgOrMRvnlJhUTRAQuRQnHpNNF8FsdAADAQADAgADbQADlpYCAAEbBA',
    //         `https://tenor.com/view/taj-mahal-india-castle-gif-15070813`,
    //         { caption: 'Your current profile picture' })
    // }
}