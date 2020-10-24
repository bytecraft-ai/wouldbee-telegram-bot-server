// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class TelegramService {}

import { Injectable, Logger } from '@nestjs/common';
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
import { downloadFile, download_file_httpget } from 'src/common/util';
import { ProfileService } from 'src/profile/profile.service';

const { leave } = Stage

const logger = new Logger('TelegramService');

@Injectable()
export class TelegramService {

    constructor(
        @InjectBot() private bot: TelegrafProvider,
        private readonly profileService: ProfileService
    ) {
        // this.greeterScene();
        // this.superWizardScene();
    }

    // registerScene() {
    //     const register = new BaseScene('register');
    //     register.enter((ctx: Context) => ctx.reply('Hi'));
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
        const telegramProfile = await this.profileService.getTelegramProfileByTelegramUserId(ctx.from.id);

        if (telegramProfile) {
            ctx.reply('Welcome back! Please use /help command to see how can you interact with me.')
        } else {
            var option = {
                "parse_mode": "Markdown",
                "reply_markup": {
                    "one_time_keyboard": true,
                    "keyboard": [[{
                        text: "My phone number",
                        request_contact: true
                    }], ["Cancel"]]
                }
            };

            let payload: string;
            try {
                // this can be registered user's public id.
                // TODO: how to use payload to make the bot better
                payload = msg.text.split(' ')[1];
            }
            catch (err) { }

            const welcomeMessage = 'Welcome to Would Bee! Please share the phone number you registered with to continue.'

            await ctx.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
                parse_mode: "Markdown",
                reply_markup: {
                    one_time_keyboard: true,
                    keyboard: [
                        [{
                            text: "Share Phone Number",
                            request_contact: true
                        },
                        {
                            text: "Cancel"
                        }],
                    ],
                    force_reply: true
                }
            });

            this.bot.on("contact", async (ctx: Context) => {
                // console.log('vcard:', ctx.update.message?.contact["vcard"])
                if (ctx.update.message?.contact["vcard"]) {
                    ctx.reply('Please share your own contact by clicking the share contact button. Do not attach a contact.')
                } else {
                    logger.log(`first name: ${msg.contact.first_name}, contact: ${msg.contact.phone_number}, chat-id: ${msg.chat.id}, user-id: ${ctx.from.id}`);

                    // const user = await this.profileService.getUserByPhone(msg.contact.phone_number, false);

                    // if (user) {
                    //     ctx.reply(`Thank you ${msg.contact.first_name} for confirming your number: ${msg.contact.phone_number}`);
                    //     const telegramProfile = await this.profileService.getORCreateTelegramProfile(msg.contact.phone_number, ctx.from.id, msg.chat.id);
                    // } else {
                    //     ctx.reply(`You are not registered with us! 
                    // Please visit www.wouldbee.com to register.`);
                    // }
                }
            });
        }
    }


    @Command('uploadbio')
    async uploadBio(ctx: Context) {

        // TODO: Set context for accepting bio-data with a 1 minute timeout in session

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your bio-data, preferably in PDF format. 
        It should not be more than 2 MB in size. Don't include profile pictures in the bio-data. 
        You can send profile picture separately using /uploadPicture command.`);

        // this.bot.on("document", async (ctx: Context) => {
        //     console.log('document-upload:', ctx.update);

        // });

        // this.bot.on("photo", async (ctx: Context) => {
        //     console.log('photo-upload:', ctx.update);

        // });
    }


    @Command('uploadPicture')
    async uploadPicture(ctx: Context) {

        // TODO: Set context for accepting profile picture with a 1 minute timeout in session

        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

        await ctx.telegram.sendMessage(ctx.chat.id, `Ok. Send me your Picture. It should clearly show your face and not be more than 5 MB in size. Your picture will be manually verified before being sent to prospective matches.`);
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


    @On('document')
    async onDocument(ctx: Context) {
        console.log('document-upload:', ctx.update);

        // file should not be more than 
        // (2MBs = 2 * 1024 * 1024 = 2097152)
        // for some tolerance, use 2.1 MB = 2202009.6
        if (ctx.message.document.file_size > 2202009.6) {
            const size = (ctx.message.document.file_size / 1048576).toFixed(2);
            ctx.reply(`Bio-data should not be more than 2 MB in size. The size of file you sent is ${size} MB. Please reduce the bio-data size and resend by giving /uploadbio command.`)

            return;
        }

        // TODO: Test doc file. docx works
        // file should be in one of - pdf, doc, or docx format
        if (ctx.message.document.mime_type === 'application/pdf' || ctx.message.document.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const link = await
                ctx.telegram.getFileLink(ctx.message.document.file_id);
            console.log('link:', link);
            const fileName = 'user-id.' + ctx.message.document.mime_type === 'application/pdf' ? 'pdf' : 'doc'
            await downloadFile(fileName, link);
            // download_file_httpget(link);

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

        const link = await
            ctx.telegram.getFileLink(photo.file_id);
        console.log('link:', link);
        // const fileName = 'user-id.' + photo.mime_type === 'application/pdf' ? 'pdf' : 'doc'
        // await downloadFile(fileName, link);
        download_file_httpget(link);

        await ctx.reply(`Success! Your Profile picture has been saved! It will be manually verified before it is sent to other members.`);
    }

}