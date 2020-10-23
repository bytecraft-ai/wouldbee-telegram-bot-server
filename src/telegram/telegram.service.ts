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

                    const user = await this.profileService.getUserByPhone(msg.contact.phone_number, false);

                    if (user) {
                        ctx.reply(`Thank you ${msg.contact.first_name} for confirming your number: ${msg.contact.phone_number}`);
                        const telegramProfile = await this.profileService.getORCreateTelegramProfile(msg.contact.phone_number, ctx.from.id, msg.chat.id);
                    } else {
                        ctx.reply(`You are not registered with us! 
                    Please visit www.wouldbee.com to register.`);
                    }
                }
            });
        }
    }

    @Command('upload-bio')
    uploadBio(ctx: Context) {
        ctx.reply('Send me your bio-data');
    }

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