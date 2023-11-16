import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/auth/entities/user.entity';
import { SendRegistrationEmailInterface } from './interfaces/send-registration-email.interface';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  public async sendRegistrationEmail(
    sendRegistrationEmailI: SendRegistrationEmailInterface,
  ) {
    const { email: recipient, name, token } = sendRegistrationEmailI;
    const confirmationLink = `${process.env.HOST_ADDRESS}/api/auth/verify?token=${token}`;
    await this.mailerService
      .sendMail({
        to: recipient, // list of receivers
        from: process.env.MAIL_USER, // sender address
        subject: 'Bienvenido a App QR! Confirma tu correo', // Subject line
        template: './confirmation', // HTML body content
        context: {
          name,
          confirmationLink,
          logoSrc: `${process.env.HOST_ADDRESS}/img/logo-email.webp`,
        },
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  preview() {}
}
