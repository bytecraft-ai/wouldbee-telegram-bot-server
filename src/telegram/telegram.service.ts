// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class TelegramService {}

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
import { TypeOfDocument } from 'src/common/enum';
import { downloadFile, download_file_httpget } from 'src/common/util';
import { ProfileService } from 'src/profile/profile.service';
import { welcomeMessage } from './telegram.constants';

const { leave } = Stage

const logger = new Logger('TelegramService');

@Injectable()
export class TelegramService {

    constructor(
        @InjectBot() private bot: TelegrafProvider,
        private readonly profileService: ProfileService
    ) {
        // // set state - profile
        // this.bot.use(async (ctx: Context, next) => {
        //     ctx.state.profile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id, { throwOnFail: false });
        //     return next();
        // })

        // set session middleware
        this.bot.use(session());

        // this.greeterScene();
        // this.superWizardScene();
        this.createRegistrationWizard();
    }


    // private getSessionKey(ctx: Context) {
    //     if (ctx.from && ctx.chat) {
    //         return `${ctx.from.id}:${ctx.chat.id}`
    //     } else if (ctx.from && ctx.inlineQuery) {
    //         return `${ctx.from.id}:${ctx.from.id}`
    //     }
    //     return null;
    // }


    // private setSessionVariable(ctx: Context, variable: any, value: any) {
    //     const key = this.getSessionKey(ctx);
    // }


    async getProfile(ctx: Context) {
        const telegramProfile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id, { throwOnFail: false });
        return telegramProfile;
    }


    async doesProfileExist(ctx: Context) {
        const telegramProfile = await this.getProfile(ctx);
        return !!telegramProfile;
    }

    // ref - https://github.com/telegraf/telegraf/issues/810
    // ref - https://github.com/telegraf/telegraf/issues/705
    createRegistrationWizard() {
        // const stepHandler = new Composer();
        // stepHandler.action('next', (ctx: Context) => {
        //     ctx.reply('Step 2. Via inline button');
        //     return ctx.wizard.next();
        // });
        // stepHandler.command('next', (ctx: Context) => {
        //     ctx.reply('Step 2. Via command');
        //     return ctx.wizard.next();
        // });
        // stepHandler.use((ctx: Context) =>
        //     ctx.replyWithMarkdown('Press `Next` button or type /next'),
        // );

        const registrationWizard = new WizardScene(
            'registration-wizard',
            async (ctx: Context) => {

                // check if the user has already been registered.
                const telegramProfile = await this.getProfile(ctx);

                if (telegramProfile) {
                    await ctx.reply(`You are already registered! If you'd like to update your profile picture or bio, you can use respective commands. To see the list of all available commands, use /help command.`);

                    return ctx.scene.leave();

                    /**
                     * TODO:
                     * Check if user is registering because of earlier failure at bio-data upload or picture upload. If so, redirect at the appropriate step and skip the steps before that.
                     */
                }

                // Step-1 :: Ask for Phone number.
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
                ctx.wizard.state.data = {};
                return ctx.wizard.next();
            },

            // Step-2 :: Read Phone number, create profile, and ask for bio.
            async (ctx: Context) => {
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
                            const telegramProfile = await this.profileService.createTelegramProfile(msg.chat.id, ctx.from.id, msg.contact.phone_number);

                            console.log('Created Telegram Profile:', telegramProfile);
                            ctx.wizard.state.data.telegramProfile = telegramProfile;
                        }
                        catch (error) {
                            logger.error('Could not create telegram profile. Error', error);
                            await ctx.reply("Some error occurred. Please try again later by using /upload_bio command!");
                            return ctx.scene.leave();
                        }

                        await ctx.reply(`Thank you ${msg.contact.first_name} for sharing your phone number: ${msg.contact.phone_number}`);
                        // return;

                        // ctx.wizard.state.data.phone_number = ctx.update.message.contact.phone_number;
                        await ctx.reply(`2. Upload your bio-data or type Cancel to quit.`);
                    }
                }
                else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply(`Canceling registration!`);
                    return ctx.scene.leave();
                }
                else {
                    await ctx.reply(`Click the "Share Phone Number" button or the "Cancel" button!`);
                    return;
                }
                return ctx.wizard.next();
            },

            // Step-3 :: download bio, upload to aws, and ask for picture.
            async (ctx: Context) => {
                const document = ctx.message.document;
                if (document) {
                    ctx.wizard.state.data.bio_file_id = ctx.message.document.file_id;

                    /**
                     * file should not be more than 
                     * (2MBs = 2 * 1024 * 1024 = 2097152)
                     * for some tolerance, use 2.1 MB = 2202009.6
                     */
                    if (document.file_size > 2202009.6) {
                        const size = (ctx.message.document.file_size / 1048576).toFixed(2);
                        await ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend by giving /uploadbio command.`)

                        return;
                    }

                    // TODO: Test doc file. docx works
                    // file should be in one of - pdf, doc, or docx format
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

                        await ctx.reply(`3. Upload your profile picture or type "Cancel" to quit.`);
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
                return ctx.wizard.next();
            },

            // Step-3 :: download picture, upload to aws, and finish.
            async (ctx: Context) => {
                console.log(ctx.update.message, ctx.update.message.photo);
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

                    await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being set to your matches.`);

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

                    await ctx.reply(`Success! Your profile picture has been saved! You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being set to your matches.`);

                }
                else if (ctx.message.text?.toLocaleLowerCase() === 'cancel') {
                    await ctx.reply(`Canceling registration!`);
                    return ctx.scene.leave();
                }
                else {
                    await ctx.reply(`Send profile picture or type "Cancel" to quit the registration process!`);
                    return;
                }
                // ctx.reply(`Your phone number is ${ctx.wizard.state.data.phone_number}`);
                // ctx.reply(`Your bio-data:`);
                // ctx.telegram.sendChatAction(ctx.chat.id, 'upload_document');
                // ctx.telegram.sendDocument(ctx.chat.id, ctx.wizard.state.data.bio_file_id);
                // ctx.reply(`Your photo:`);
                // ctx.telegram.sendChatAction(ctx.chat.id, 'upload_photo');
                // ctx.telegram.sendPhoto(ctx.chat.id, ctx.wizard.state.data.photo_file_id);

                await ctx.reply(`Thank you for registering! You can now use /preference command to set your match preference.`);
                return ctx.scene.leave();
            }
        );
        const stage = new Stage([registrationWizard]);
        this.bot.use(stage.middleware());
        this.bot.command('register_me', ctx => {
            ctx.scene.enter('registration-wizard');
        });
    }



    // registerScene() {
    //     const register = new BaseScene('register');
    //     register.enter((ctx: Context) => ctx.reply('To register, share your phone number by clicking the button below.'));
    //     register.on("contact", async (ctx: Context) => {
    //         const msg = ctx.message;
    //         // console.log('vcard:', ctx.update.message?.contact["vcard"])
    //         if (ctx.update.message?.contact["vcard"]) {
    //             ctx.reply('Please share your phone number by clicking the button below.')
    //         } else {
    //             logger.log(`Contact shared: First name: ${msg.contact.first_name}, contact: ${msg.contact.phone_number}, chat-id: ${msg.chat.id}, user-id: ${ctx.from.id}`);

    //             const telegramProfile = await this.profileService.createTelegramProfile(msg.chat.id, ctx.from.id, msg.contact.phone_number);
    //             await ctx.reply(`Thank you ${msg.contact.first_name} for sharing your phone number: ${msg.contact.phone_number}`);
    //             return;
    //         }
    //     });
    // }

    // greeterScene() {
    //     const greeter = new BaseScene('greeter');
    //     greeter.enter((ctx: Context) => ctx.reply('Hi'))
    //     greeter.leave((ctx: Context) => ctx.reply('Bye'))
    //     // greeter.hears(/hi/gi, Stage.leave())
    //     greeter.hears('hi', leave())
    //     greeter.on('message', (ctx: Context) => ctx.reply('Send `hi`'))

    //     // Create scene manager
    //     const stage = new Stage()
    //     stage.command('cancel', leave())

    //     // Scene registration
    //     stage.register(greeter)

    //     this.bot.use(session())
    //     this.bot.use(stage.middleware())
    //     this.bot.command('greeter', (ctx: Context) => ctx.scene.enter('greeter'))
    // }

    // superWizardScene() {
    //     const stepHandler = new Composer();
    //     stepHandler.action('next', (ctx: Context) => {
    //         ctx.reply('Step 2. Via inline button');
    //         return ctx.wizard.next();
    //     });
    //     stepHandler.command('next', (ctx: Context) => {
    //         ctx.reply('Step 2. Via command');
    //         return ctx.wizard.next();
    //     });
    //     stepHandler.use((ctx: Context) =>
    //         ctx.replyWithMarkdown('Press `Next` button or type /next'),
    //     );

    //     const superWizard = new WizardScene(
    //         'super-wizard',
    //         (ctx: Context) => {
    //             ctx.reply(
    //                 'Step 1',
    //                 Markup.inlineKeyboard([
    //                     Markup.urlButton('❤️', 'http://telegraf.js.org'),
    //                     Markup.callbackButton('➡️ Next', 'next'),
    //                 ]).extra(),
    //             );
    //             return ctx.wizard.next();
    //         },
    //         stepHandler,
    //         (ctx: Context) => {
    //             ctx.reply('Step 3');
    //             return ctx.wizard.next();
    //         },
    //         (ctx: Context) => {
    //             ctx.reply('Step 4');
    //             return ctx.wizard.next();
    //         },
    //         (ctx: Context) => {
    //             ctx.reply('Done');
    //             return ctx.scene.leave();
    //         },
    //     );

    //     const stage = new Stage([superWizard], { default: 'super-wizard' });
    //     this.bot.use(session());
    //     this.bot.use(stage.middleware());
    // }

    @Start()
    async start(ctx: Context) {
        const msg = ctx.message;

        ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        if (this.doesProfileExist(ctx)) {
            await ctx.reply('Welcome back! Please use /help command to see how you can interact with me.')
        } else {
            await ctx.reply(welcomeMessage);
        }
    }


    @Command('upload_bio')
    async uploadBio(ctx: Context) {

        // TODO: Set context for accepting bio-data with a 1 minute timeout in session

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your bio-data, preferably in PDF format. It should not be more than 2 MB in size. Don't include profile pictures in the bio-data. You can send profile picture separately using /upload_pic command. Note that it will be verified manually before being sent to prospective matches.`);
    }


    @On('document')
    async onDocument(ctx: Context) {
        const document = ctx.message.document;
        console.log('document-upload:', ctx.update);

        await ctx.telegram.sendChatAction(ctx.message.chat.id, 'upload_document');

        const telegramProfile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id, {
            throwOnFail: false
        });
        if (!telegramProfile) {
            ctx.reply('Please verify your phone number first by using /start command.');
            return;
        }

        // file should not be more than 
        // (2MBs = 2 * 1024 * 1024 = 2097152)
        // for some tolerance, use 2.1 MB = 2202009.6
        if (document.file_size > 2202009.6) {
            const size = (ctx.message.document.file_size / 1048576).toFixed(2);
            ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend by giving /uploadbio command.`)

            return;
        }

        // TODO: Test doc file. docx works
        // file should be in one of - pdf, doc, or docx format
        if (document.mime_type === 'application/pdf' || document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {

            // ref - https://github.com/telegraf/telegraf/issues/277
            const link = await ctx.telegram.getFileLink(document.file_id);

            let fileName = telegramProfile.id + '_bio.';
            let extension: string = link.split('.')[-1];
            if (!extension ||
                (extension !== 'pdf'
                    && extension !== 'doc'
                    && extension !== 'docx')
            ) {
                extension = document.mime_type === 'application/pdf' ? 'pdf' : 'docx'
            }
            fileName = fileName + extension;
            console.log('fileName:', fileName);

            await downloadFile(link, fileName);

            await this.profileService.uploadDocument(ctx.from.id, fileName, document.mime_type, TypeOfDocument.BIO_DATA, document.file_id);

            await ctx.reply(`Success! Your bio-data has been saved! You can update it anytime using the /uploadbio command.
            
            Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.

            Till then, you can set your match preferences. To see how, use the /help command.
            `);

            // TODO: Remove context for accepting bio-data.
            return;

        } else {
            await ctx.reply(`Only PDF and Word files are supported for Bio-data. Please try again with a PDF or Word file using /uploadbio command.`);

            return;
        }
    }


    @Command('upload_pic')
    async uploadPicture(ctx: Context) {

        // TODO: Set context for accepting profile picture with a 1 minute timeout in session

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your Picture. It should clearly show your face and not be more than 5 MB in size. Your picture will be manually verified before being sent to prospective matches.`);
    }


    @On('photo')
    async onPhoto(ctx: Context) {
        console.log('photo-upload:', ctx.update.message.photo);
        await ctx.reply(`Thanks!`);
        // return;

        // Choose the smallest picture to save
        const photo = ctx.update.message.photo[0];

        // photo should not be more than 1 MB)
        // for some tolerance, use 1.1 MB = 1152433.6
        if (photo.file_size > 1152433.6) {
            const size = (ctx.message.document.file_size / 1048576).toFixed(2);
            ctx.reply(`Photo should not be more than 5 MB in size. Please use a smaller sized photo and resend by giving /uploadpicture command.`)

            return;
        }

        // No need to handle GIFs as they come as documents

        const link = await ctx.telegram.getFileLink(photo.file_id);
        // console.log('link:', link);
        // const fileName = 'user-id.' + photo.mime_type === 'application/pdf' ? 'pdf' : 'doc'
        // await downloadFile(fileName, link);
        download_file_httpget(link, 'photo');

        await ctx.reply(`Success! Your Profile picture has been saved! It will be manually verified before it is sent to other members.`);
    }


    @Command('updates')
    async sendBio(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'upload_document');
        await ctx.telegram.sendMessage(ctx.message.chat.id, 'Sending a bio-data');
        const document = await ctx.telegram.sendDocument(
            ctx.message.chat.id,
            // option 1: use publicly accessible url
            // 'http://www.africau.edu/images/default/sample.pdf',

            // option 2: use file_id generated by telegram
            'BQACAgQAAxkDAAOGX5Jyq2s3oqkBfMGkR356U-VkPwUAAiMCAAKTWkVQthkVols1F6YbBA',

            // option 3: use file from source
            // {
            // url: 'http://www.africau.edu/images/default/sample.pdf',
            // source: 'biodatas/sample.docx',
            // filename: 'sample.docx'
            // },
            { caption: 'Match Score: 80%' }
        );
        console.log(document.document);
    }


    // TODO
    @Command('my_profile_picture')
    async sendPhoto(ctx: Context) {
        await ctx.telegram.sendChatAction(ctx.chat.id, 'upload_photo');
        await ctx.telegram.sendPhoto(ctx.message.chat.id,
            // 'AgACAgUAAxkBAAOxX5Om1-bJ6u-jtMMdbWygyNZaQ_kAAgOrMRvnlJhUTRAQuRQnHpNNF8FsdAADAQADAgADbQADlpYCAAEbBA',
            `https://tenor.com/view/taj-mahal-india-castle-gif-15070813`,
            { caption: 'Your current profile picture' })
    }


    // TODO
    @Help()
    help(ctx: Context) {
        ctx.reply('Send me a sticker');
    }


    @On('sticker')
    onSticker(ctx: Context) {
        ctx.reply('👍');
    }


    @Hears('hello')
    @Hears('hi')
    hears(ctx: Context) {
        ctx.reply('Hey there');
    }


    feedback(ctx: Context) {
        ctx.reply('How are you liking our service? Please give us the feedback below')
    }

}