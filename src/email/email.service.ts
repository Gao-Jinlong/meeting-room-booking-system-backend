import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;
  @Inject(ConfigService)
  configService: ConfigService;

  constructor(configService: ConfigService) {
    this.transporter = createTransport({
      host: configService.get('nodemailer_host'),
      port: configService.get('nodemailer_port'),
      secure: false,
      auth: {
        user: configService.get('nodemailer_auth_user'),
        pass: configService.get('mail_password'),
      },
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: '会议室预订系统',
        address: '2675130594@qq.com',
      },
      to,
      subject,
      html,
    });
  }
}
