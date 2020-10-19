import { Get, Controller, Render, Logger } from '@nestjs/common';

const logger = new Logger('AppController');

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Welcome to Would Bee! Please register to get started!' };
  }
}