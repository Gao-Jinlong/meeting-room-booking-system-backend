import {
  Controller,
  Post,
  Body,
  Inject,
  Query,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiBadRequestResponse, ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiTags('user')
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

  @Post('login')
  @ApiBody({
    type: LoginUserDto,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户名或密码错误 | 用户不存在',
    isArray: true,
  })
  async userLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);
    return {
      type: HttpStatus.OK,
      data: vo,
      message: 'success',
    };
  }

  @Post('admin/login')
  @ApiBody({
    type: LoginUserDto,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户名或密码错误 | 用户不存在',
    isArray: true,
  })
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);
    return {
      type: HttpStatus.OK,
      data: vo,
      message: 'success',
    };
  }
}
