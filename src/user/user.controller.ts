import {
  Controller,
  Post,
  Body,
  Inject,
  Query,
  Get,
  HttpStatus,
  UnauthorizedException,
  Request,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as RequestType } from 'express';
import {
  RequireLogin,
  RequirePermission,
  UserInfo,
} from 'src/custom.decorator';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generateParseIntPipe } from 'src/utils';

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
    return vo;
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
    return vo;
  }

  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      const tokens = await this.userService.refreshToken(refreshToken);
      return tokens;
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('token 已失效');
    }
  }

  @Get('needLogin')
  @RequireLogin()
  @RequirePermission('access_of_roles')
  @ApiBearerAuth('bearer')
  async needLogin(
    @Request() request: RequestType,
    @UserInfo('username') username: string,
    @UserInfo() userInfo,
  ) {
    try {
      return {
        user: request.user,
        userInfo,
        username,
      };
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('token 已失效');
    }
  }

  @Get('allowAnonymous')
  async allowAnonymous() {
    return {
      message: '允许匿名访问',
    };
  }

  @ApiBearerAuth('bearer')
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('id') userId: number) {
    console.log('userInfo', userId);
    return await this.userService.findUserDetailById(userId);
  }

  @ApiBearerAuth('bearer')
  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  async updatePassword(
    @UserInfo('id') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    console.log('userInfo', userId);
    return this.userService.updatePassword(userId, passwordDto);
  }

  @Get('update_password/captcha')
  @RequireLogin()
  @ApiBearerAuth('bearer')
  async updatePasswordCaptcha(@Query('address') address: string) {
    return await this.userService.updatePasswordCaptcha(address);
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  @ApiBearerAuth('bearer')
  async update(
    @UserInfo('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  @Get('update/captcha')
  @RequireLogin()
  @ApiBearerAuth('bearer')
  async updateCaptcha(@Query('address') address: string) {
    return await this.userService.sendUpdateUserInfoCaptcha(address);
  }

  @Get('freeze')
  @RequireLogin()
  @RequirePermission('access_of_users')
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUsersByPage(
      pageNo,
      pageSize,
      username,
      nickName,
      email,
    );
  }
}
