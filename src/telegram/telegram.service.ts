/**
 * TODO:
 *  1. Use payload to implement referrals and tracking (if a user is 
 *      given the link by another user, an agent, or website)
 * 
 *  2. Implement status - what does a user need to do next
 * 
 *  3. Implement sharing
 */

import { Injectable, Logger } from '@nestjs/common';
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
} from 'nestjs-telegraf';
import { RegistrationStatus, TypeOfDocument } from 'src/common/enum';
import { downloadFile, download_file_httpget } from 'src/common/util';
import { TelegramProfile } from 'src/profile/entities/telegram-profile.entity';
import { ProfileService } from 'src/profile/profile.service';
import { welcomeMessage, helpMessage } from './telegram.constants';

const { leave } = Stage

const logger = new Logger('TelegramService');

@Injectable()
export class TelegramService {

    constructor(
        @InjectBot() private bot: TelegrafProvider,
        private readonly profileService: ProfileService
    ) {

        // set session middleware - required for creating wizard
        this.bot.use(session());

        // this.greeterScene();
        // this.superWizardScene();
        this.createRegistrationWizard();
        // this.createUploadBioWizard();
        // this.createUploadPictureWizard();

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

                // await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                let telegramProfile = await this.getProfile(ctx);
                if (telegramProfile) {
                    ctx.wizard.state.data.telegramProfileId = telegramProfile.id;
                    const status = await this.profileService.getRegistrationStatus(telegramProfile.id);
                    logger.log(`status: ${JSON.stringify(status)}`);
                    ctx.wizard.state.data.status = status;
                } else {
                    ctx.wizard.state.data.telegramProfileId = (await this.createTelegramProfile(ctx)).id;
                    ctx.wizard.state.data.status = RegistrationStatus.UNREGISTERED;
                }

                if (ctx.wizard.state.data.status === RegistrationStatus.PICTURE_UPLOADED) {
                    await ctx.reply(`You are already registered! If you'd like to update your profile picture or bio, you can use respective commands. To see the list of all available commands, use /help command.`);

                    return ctx.scene.leave();

                } else if (ctx.wizard.state.data.status >= RegistrationStatus.PHONE_VERIFIED) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-1`);
                    ctx.wizard.state.data.next_without_user_input = true;
                } else {
                    ctx.wizard.state.data.next_without_user_input = false;
                    await ctx.telegram.sendMessage(ctx.chat.id, '1. Share your phone number by clicking the button below.', {
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

                // problem - wizard.next() does not work without user input
                // solution ref - https://github.com/telegraf/telegraf/issues/566#issuecomment-443209798
                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-2 :: Read Phone number, update into profile
            async (ctx: Context) => {
                logger.log(`Step-2:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status >= RegistrationStatus.PHONE_VERIFIED) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-2`);
                    ctx.wizard.state.data.next_without_user_input = true;
                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
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
                return ctx.wizard.next();
                // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-3: Ask for Bio
            async (ctx: Context) => {
                logger.log(`Step-3:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status >= RegistrationStatus.BIO_UPLOADED) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-3, calling step-4`);
                } else {
                    await ctx.reply(`2. Upload your bio-data or type Cancel to quit.`);
                }

                ctx.wizard.state.data.next_without_user_input = true;
                logger.log('calling step-4');
                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-4 :: download bio, upload to aws.
            async (ctx: Context) => {
                logger.log(`Step-4:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status >= RegistrationStatus.BIO_UPLOADED) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-4, calling step-5`);
                    ctx.wizard.state.data.next_without_user_input = true;
                    ctx.wizard.next();
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
                    const document = ctx.message.document;
                    if (document) {
                        // ctx.wizard.state.data.bio_file_id = ctx.message.document.file_id;

                        /**
                         * file should not be more than 
                         * (2MBs = 2 * 1024 * 1024 = 2097152)
                         * for some tolerance, use 2.1 MB = 2202009.6
                         */
                        if (document.file_size > 2202009.6) {
                            const size = (ctx.message.document.file_size / 1048576).toFixed(2);
                            await ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`);

                            return;
                        }

                        // TODO: Test doc file. docx works
                        // file should be in one of - pdf, doc, or docx format
                        if (document.mime_type === 'application/pdf' || document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {

                            // ref - https://github.com/telegraf/telegraf/issues/277
                            const link = await ctx.telegram.getFileLink(document.file_id);
                            logger.log(`bio download link: ${link}`);

                            const telegramProfileId = ctx.wizard.state.data.telegramProfileId;

                            let fileName = telegramProfileId + '_bio.'
                            const nameParts = link.split('.');
                            console.log('nameParts', nameParts);

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
                                extension = document.mime_type === 'application/pdf' ? 'pdf' : 'docx'
                            }

                            fileName = fileName + extension;
                            console.log('fileName:', fileName);
                            try {
                                await downloadFile(link, fileName);

                                await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.BIO_DATA, document.file_id);

                            } catch (error) {
                                logger.error("Could not download/upload the bio-data. Error:", error);
                                await ctx.reply("Some error occurred. Please try again later!");
                                return ctx.scene.leave();
                            }

                            await ctx.reply(`Success! Your bio-data has been saved! You can update it anytime using the /upload_bio command.
            
                        Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.`);

                        } else {
                            // document type not supported
                            await ctx.reply(`Error: Only pdf or word files are supported for bio-data. Please retry.`);
                            return;
                        }
                    } else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply(`Canceling registration!`);
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

                if (ctx.wizard.state.data.status >= RegistrationStatus.PICTURE_UPLOADED) {
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-5`);
                } else {
                    await ctx.reply(`3. Upload your profile picture or type Cancel to quit.`);
                }
                ctx.wizard.state.data.next_without_user_input = true;
                logger.log('calling step-6');
                ctx.wizard.next();
                return ctx.wizard.steps[ctx.wizard.cursor](ctx);
            },

            // Step-6 :: download picture, upload to aws, and finish.
            async (ctx: Context) => {
                logger.log(`Step-6:: status-${ctx.wizard.state.data.status}`);

                if (ctx.wizard.state.data.status >= RegistrationStatus.PICTURE_UPLOADED) {
                    // return ctx.wizard.next();
                    logger.log(`Status: ${ctx.wizard.state.data.status}, skipping step-6, leaving wizard!`);
                    // return ctx.scene.leave();
                } else {
                    console.log(ctx.update.message);
                    const photos = ctx.update.message.photo;
                    const document = ctx.message.document;

                    // if photo is shared by photo sharing option.
                    if (photos && photos[0]) {
                        const photo = photos[0];
                        const telegramProfileId = ctx.wizard.state.data.telegramProfileId;
                        ctx.wizard.state.data.photo_file_id = photo.file_id;

                        const link = await ctx.telegram.getFileLink(photo.file_id);
                        console.log('picture download link:', link);

                        let fileName = telegramProfileId + '_picture.'
                        const nameParts = link.split('.');
                        console.log('nameParts', nameParts);

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
                        if (failure) {
                            logger.error(`ERROR: Could not determine the extension for the file_id: ${photo.file_id} and link: ${link}`);

                            await ctx.reply(`Error: Only "jpeg" and "png" files are supported for profile picture. Please resend a supported picture.`);
                            return;
                        }

                        fileName = fileName + extension;
                        const mime_type = extension === 'jpg' || extension === 'jpeg'
                            ? 'image/jpeg' : 'image/png';
                        logger.log(`fileName: ${fileName}, mime: ${mime_type}`);

                        try {
                            await downloadFile(link, fileName);

                            await this.profileService.uploadDocument(ctx.from.id, fileName, mime_type, TypeOfDocument.PICTURE, photo.file_id);
                        } catch (error) {
                            logger.error("Could not download/upload the bio-data. Error:", error);
                            await ctx.reply("Some error occurred. Please try again later!");
                            return ctx.scene.leave();
                        }

                        await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being sent to your matches.`);

                    }

                    // if photo is shared document
                    else if (document && (
                        document.mime_type === 'image/jpeg'
                        || document.mime_type === 'image/png'
                    )
                    ) {
                        const telegramProfileId = ctx.wizard.state.data.telegramProfileId;
                        ctx.wizard.state.data.photo_file_id = document.file_id;

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
                        if (failure) {
                            logger.error(`ERROR: Could not determine the extension for the file_id: ${document.file_id} and link: ${link}`);

                            await ctx.reply(`Error: Only "jpeg" and "png" files are supported for profile picture. Please resend a supported picture.`);
                            return;
                        }

                        fileName = fileName + extension;
                        logger.log(`fileName: ${fileName}, mime: ${document.mime_type}`);

                        try {
                            await downloadFile(link, fileName);

                            await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.PICTURE, document.file_id);
                        } catch (error) {
                            logger.error("Could not download/upload the bio-data. Error:", error);
                            await ctx.reply("Some error occurred. Please try again later!");
                            return ctx.scene.leave();
                        }

                        await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being sent to your matches.`);

                    }
                    else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                        await ctx.reply(`Canceling registration!`);
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

                    await ctx.reply(`Thank you for registering! You can now use /preference command to set your match preference.`);
                    // return ctx.scene.leave();
                }
                return ctx.scene.leave();
            }
        );
        const stage = new Stage([registrationWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('register_me', ctx => {
            ctx.scene.enter('registration-wizard');
        });
    }


    createUploadBioWizard() {
        const bioWizard = new WizardScene(
            'bio-wizard',

            async (ctx: Context) => {

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                const telegramProfile = await this.getProfile(ctx);

                if (!telegramProfile) {
                    await ctx.reply(`You are not registered! To register, please type or click on /register_me command. To see the list of all available commands, use /help command.`);

                    return ctx.scene.leave();
                }

                logger.log(`telegram profile: ${telegramProfile}`);

                await ctx.reply(`Upload your bio-data or type Cancel to quit.`);

                const document = ctx.message.document;
                if (document) {
                    if (document.file_size > 2202009.6) {
                        const size = (ctx.message.document.file_size / 1048576).toFixed(2);
                        await ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend using /upload_bio command.`);

                        return;
                    }

                    if (document.mime_type === 'application/pdf' || document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {

                        // ref - https://github.com/telegraf/telegraf/issues/277
                        const link = await ctx.telegram.getFileLink(document.file_id);
                        logger.log(`bio download link: ${link}`);

                        const telegramProfile = ctx.wizard.state.data.telegramProfile;

                        let fileName = telegramProfile.id + '_bio.'
                        const nameParts = link.split('.');
                        console.log('nameParts', nameParts);

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
                            extension = document.mime_type === 'application/pdf' ? 'pdf' : 'docx'
                        }

                        fileName = fileName + extension;
                        console.log('fileName:', fileName);
                        try {
                            await downloadFile(link, fileName);

                            await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.BIO_DATA, document.file_id);

                        } catch (error) {
                            logger.error("Could not download/upload the bio-data. Error:", error);
                            await ctx.reply("Some error occurred. Please try again later!");
                            return ctx.scene.leave();
                        }

                        await ctx.reply(`Success! Your bio-data has been saved! You can update it anytime using the /upload_bio command.

                        Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.`);
                        return ctx.scene.leave();
                    } else {
                        // document type not supported
                        await ctx.reply(`Error: Only pdf or word files are supported for bio-data. Please retry.`);
                        return;
                    }
                } else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply(`Canceling registration!`);
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

            async (ctx: Context) => {

                await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

                // check if the user has already been registered.
                const telegramProfile = await this.getProfile(ctx);

                if (!telegramProfile) {
                    await ctx.reply(`You are not registered! To register, please type or click on /register_me command. To see the list of all available commands, use /help command.`);

                    return ctx.scene.leave();
                }

                console.log(ctx.update.message);
                const photos = ctx.update.message.photo;
                const document = ctx.message.document;

                // if photo is shared by photo sharing option.
                if (photos && photos[0]) {
                    const photo = photos[0];
                    const telegramProfile = ctx.wizard.state.data.telegramProfile;
                    ctx.wizard.state.data.photo_file_id = photo.file_id;

                    const link = await ctx.telegram.getFileLink(photo.file_id);
                    console.log('picture download link:', link);

                    let fileName = telegramProfile.id + '_picture.'
                    const nameParts = link.split('.');
                    console.log('nameParts', nameParts);

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
                    if (failure) {
                        logger.error(`ERROR: Could not determine the extension for the file_id: ${photo.file_id} and link: ${link}`);

                        await ctx.reply(`Error: Only "jpeg" and "png" files are supported for profile picture. Please resend a supported picture.`);
                        return;
                    }

                    fileName = fileName + extension;
                    const mime_type = extension === 'jpg' || extension === 'jpeg'
                        ? 'image/jpeg' : 'image/png';
                    logger.log(`fileName: ${fileName}, mime: ${mime_type}`);

                    try {
                        await downloadFile(link, fileName);

                        await this.profileService.uploadDocument(ctx.from.id, fileName, mime_type, TypeOfDocument.PICTURE, photo.file_id);
                    } catch (error) {
                        logger.error("Could not download/upload the bio-data. Error:", error);
                        await ctx.reply("Some error occurred. Please try again later!");
                        return ctx.scene.leave();
                    }

                    await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being sent to your matches.`);

                }

                // if photo is shared document
                else if (document && (
                    document.mime_type === 'image/jpeg'
                    || document.mime_type === 'image/png'
                )
                ) {
                    const telegramProfile = ctx.wizard.state.data.telegramProfile;
                    ctx.wizard.state.data.photo_file_id = document.file_id;

                    const link = await ctx.telegram.getFileLink(document.file_id);
                    console.log('picture download link:', link);

                    let fileName = telegramProfile.id + '_picture.'
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
                    if (failure) {
                        logger.error(`ERROR: Could not determine the extension for the file_id: ${document.file_id} and link: ${link}`);

                        await ctx.reply(`Error: Only "jpeg" and "png" files are supported for profile picture. Please resend a supported picture.`);
                        return;
                    }

                    fileName = fileName + extension;
                    logger.log(`fileName: ${fileName}, mime: ${document.mime_type}`);

                    try {
                        await downloadFile(link, fileName);

                        await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.PICTURE, document.file_id);
                    } catch (error) {
                        logger.error("Could not download/upload the bio-data. Error:", error);
                        await ctx.reply("Some error occurred. Please try again later!");
                        return ctx.scene.leave();
                    }

                    await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being sent to your matches.`);
                    return ctx.scene.leave();
                }
                else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply(`Canceling registration!`);
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
                const referee = await this.profileService.getProfile(payload, false);
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


    // TODO
    @Command('status')
    async status(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('TODO')
    }


    @Hears('hello')
    @Hears('hi')
    @Hears('hey')
    async hears(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('Hi there');
    }


    @Command('support')
    async support(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        await ctx.reply('Please email your issue to us on `support@wouldbee.com` and we will try our best to help you out.')
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


    // @On('video')
    // @On('animation')
    // @On('sticker')
    // @On('photo')
    // @On('document')
    // @On('audio')
    // @On('voice')
    // @Hears('')
    // onUnsupportedCommand(ctx: Context) {
    //     ctx.reply('Please use /help command to see what this bot supports.');
    // }




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