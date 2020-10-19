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

const { leave } = Stage

const logger = new Logger('TelegramService');

@Injectable()
export class TelegramService {

    constructor(@InjectBot() private bot: TelegrafProvider) {
        this.greeterScene();
        // this.superWizardScene();
    }

    // registerScene() {
    //     const register = new BaseScene('register');
    //     register.enter((ctx: Context) => ctx.reply('Hi'));
    // }

    greeterScene() {
        const greeter = new BaseScene('greeter');
        greeter.enter((ctx: Context) => ctx.reply('Hi'))
        greeter.leave((ctx: Context) => ctx.reply('Bye'))
        // greeter.hears(/hi/gi, Stage.leave())
        greeter.hears('hi', leave())
        greeter.on('message', (ctx: Context) => ctx.reply('Send `hi`'))

        // Create scene manager
        const stage = new Stage()
        stage.command('cancel', leave())

        // Scene registration
        stage.register(greeter)

        this.bot.use(session())
        this.bot.use(stage.middleware())
        this.bot.command('greeter', (ctx: Context) => ctx.scene.enter('greeter'))
    }

    superWizardScene() {
        const stepHandler = new Composer();
        stepHandler.action('next', (ctx: Context) => {
            ctx.reply('Step 2. Via inline button');
            return ctx.wizard.next();
        });
        stepHandler.command('next', (ctx: Context) => {
            ctx.reply('Step 2. Via command');
            return ctx.wizard.next();
        });
        stepHandler.use((ctx: Context) =>
            ctx.replyWithMarkdown('Press `Next` button or type /next'),
        );

        const superWizard = new WizardScene(
            'super-wizard',
            (ctx: Context) => {
                ctx.reply(
                    'Step 1',
                    Markup.inlineKeyboard([
                        Markup.urlButton('❤️', 'http://telegraf.js.org'),
                        Markup.callbackButton('➡️ Next', 'next'),
                    ]).extra(),
                );
                return ctx.wizard.next();
            },
            stepHandler,
            (ctx: Context) => {
                ctx.reply('Step 3');
                return ctx.wizard.next();
            },
            (ctx: Context) => {
                ctx.reply('Step 4');
                return ctx.wizard.next();
            },
            (ctx: Context) => {
                ctx.reply('Done');
                return ctx.scene.leave();
            },
        );

        const stage = new Stage([superWizard], { default: 'super-wizard' });
        this.bot.use(session());
        this.bot.use(stage.middleware());
    }

    @Start()
    start(ctx: Context) {
        // ctx.reply('Welcome to WouldBee');
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
        ctx.telegram.sendMessage(ctx.chat.id, "Please confirm your phone number", {
            parse_mode: "Markdown",
            reply_markup: {
                one_time_keyboard: true,
                keyboard: [
                    [{
                        text: "Confirm",
                        request_contact: true
                    },
                    {
                        text: "Cancel"
                    }],
                ],
                force_reply: true
            }
        }).then(() => {
            // console.log('message:', ctx.message);
            // ctx.deleteMessage()
            // ctx.telegram.sendMessage(ctx.chat.id, 'Thank you for confirmation, you will start receiving matches now!')
            this.bot.on("contact", (ctx: Context) => {
                const msg = ctx.message;
                ctx.reply(`Thank you ${msg.contact.first_name} for confirming your number: ${msg.contact.phone_number}`)
            })
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