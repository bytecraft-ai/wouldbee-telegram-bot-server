import { Injectable, Logger } from '@nestjs/common';

const logger = new Logger('AppService');

@Injectable()
export class AppService { }

// import { Injectable, Logger } from '@nestjs/common';
// import {
//   Start,
//   Help,
//   On,
//   Hears,
//   Context,
// } from 'nestjs-telegraf';

// const logger = new Logger('AppService');

// @Injectable()
// export class AppService {

//   @Start()
//   start(ctx: Context) {
//     // ctx.reply('Welcome to WouldBee');
//     var option = {
//       "parse_mode": "Markdown",
//       "reply_markup": {
//         "one_time_keyboard": true,
//         "keyboard": [[{
//           text: "My phone number",
//           request_contact: true
//         }], ["Cancel"]]
//       }
//     };
//     ctx.telegram.sendMessage(ctx.chat.id, "Please confirm your phone number", {
//       parse_mode: "Markdown",
//       reply_markup: {
//         one_time_keyboard: true,
//         keyboard: [
//           [{
//             text: "Confirm",
//             request_contact: true
//           },
//           {
//             text: "Cancel"
//           }],
//         ],
//         force_reply: true
//       }
//     }).then(() => {
//       // console.log('message:', ctx.message);
//       // ctx.deleteMessage()
//       // ctx.telegram.sendMessage(ctx.chat.id, 'Thank you for confirmation, you will start receiving matches now!')

//     })
//   }

//   @On('contact')
//   OnContact(ctx: Context) {
//     const msg = ctx.message;
//     ctx.reply(`Thank you ${msg.contact.first_name} for confirming your number: ${msg.contact.phone_number}`)
//   }

//   @Help()
//   help(ctx: Context) {
//     ctx.reply('Send me a sticker');
//   }

//   @On('sticker')
//   onSticker(ctx: Context) {
//     ctx.reply('👍');
//   }

//   @Hears('hello')
//   @Hears('hi')
//   hears(ctx: Context) {
//     ctx.reply('Hey there');
//   }
// }