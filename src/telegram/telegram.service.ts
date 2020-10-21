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

        // await ctx.telegram.sendMessage(ctx.chat.id, welcomeMessage, {
        //     // parse_mode: "Markdown",
        //     reply_markup: {
        //         keyboard: [
        //             [{
        //                 text: "Share Phone Number",
        //                 request_contact: true
        //             },
        //             {
        //                 text: "Cancel",
        //             }],
        //         ],
        //         // force_reply: true
        //     }
        // })

        // On sharing own number by clicking button, we will not receive a vcard.
        // However, on sending a random contact from contact list, we will receive a vcard.
        this.bot.on("contact", async (ctx: Context) => {
            const msg = ctx.message;
            // console.log('vcard:', ctx.update.message?.contact["vcard"])
            if (ctx.update.message?.contact["vcard"]) {
                ctx.reply('Please share your own contact by clicking the share contact button. You need not attach a contact.')
            } else {
                logger.log(`first name: ${msg.contact.first_name}, contact: ${msg.contact.phone_number}, chat-id: ${msg.chat.id}, user-id: ${ctx.from.id}`);
                const user = await this.profileService.getUserByPhone(msg.contact.phone_number, false);
                if (user) {
                    ctx.reply(`Thank you ${msg.contact.first_name} for confirming your number: ${msg.contact.phone_number}`);
                    const telegramProfile = await this.profileService.getORCreateTelegramProfile(msg.contact.phone_number, ctx.from.id, msg.chat.id);
                } else {
                    ctx.reply(`You are not registered with us! Please visit www.wouldbee.com to register.`);
                }
            }

            // console.log('from:', ctx.from, 'update-type:', ctx.updateType, 'update-sub-type:', ctx.updateSubTypes, 'update:', ctx.update, 'callback-query:', ctx.callbackQuery, 'chosen-inline-result:', ctx.chosenInlineResult, 'inlineQuery:', ctx.inlineQuery);
        })
    }

    // @On('contact')
    // OnContact(ctx: Context) {
    //     const msg = ctx.message;
    //     ctx.reply(`You sent a contact: ${msg.contact.phone_number}`)
    // }

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

}