import { Controller, Post, Body, Inject, Query, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Controller('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService;
  @Inject(RedisService)
  private redisService: RedisService;

  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() register: RegisterUserDto) {
    return await this.userService.register(register);
  }

  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const captcha = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, captcha, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>您的注册验证码为：${captcha}</p>`,
    });

    return {
      success: true,
    };
  }
}
