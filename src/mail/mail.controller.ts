import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Get()
  exampleMail() {
    return this.mailService.sendRegistrationEmail({
      name: 'Hugo',
      email: 'halvarez4@ucol.mx',
      token: '123456',
    });
  }
}
