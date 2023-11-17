import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendEmailInterface } from './interfaces/send-registration-email.interface';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private url = `${process.env.HOST_ADDRESS}:${process.env.HOST_PORT}`;
  private logoSrc = `${this.url}/img/logo-email.webp`;

  public async sendRegistrationEmail(sendEmailI: SendEmailInterface) {
    //Self url
    const { email: recipient, name, token } = sendEmailI;
    const confirmationLink = `${this.url}/api/auth/verify?token=${token}`;
    await this.mailerService
      .sendMail({
        to: recipient, // list of receivers
        from: process.env.MAIL_USER, // sender address
        subject: 'Bienvenido a App QR! Confirma tu correo', // Subject line
        template: './confirmation', // HTML body content
        context: {
          name,
          confirmationLink,
          logoSrc: this.logoSrc,
        },
      })
      .catch((err) => {
        console.log(err);
        throw new InternalServerErrorException();
      });
  }

  public async sendForgotPasswordEmail(sendEmailI: SendEmailInterface) {
    //Self url
    const { email: recipient, name, token } = sendEmailI;
    const passwordLink = `${this.url}/auth/resetPassword.html?token=${token}`;
    await this.mailerService
      .sendMail({
        to: recipient, // list of receivers
        from: process.env.MAIL_USER, // sender address
        subject: 'Reestablece tu contraseña de QR App aquí', // Subject line
        template: './forgot-password', // HTML body content
        context: {
          name,
          passwordLink,
          logoSrc: this.logoSrc,
        },
      })
      .catch((err) => {
        console.log(err);
        throw new InternalServerErrorException();
      });
  }
}
