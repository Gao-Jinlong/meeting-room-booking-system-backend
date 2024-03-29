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
  UseInterceptors,
  UploadedFile,
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
  ApiQuery,
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
import { RefreshTokenVo } from './vo/refresh-token.vo';
import { UserDetailVo } from './vo/user-detail.vo';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { storage } from 'src/my-file-storage';

@Controller('user')
@ApiTags('user')
export class UserController {
  @Inject(EmailService)
  private emailService: EmailService;
  @Inject(RedisService)
  private redisService: RedisService;

  constructor(private readonly userService: UserService) {}

  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确/用户已存在',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '注册成功/失败',
    type: String,
  })
  @Post('register')
  async register(@Body() register: RegisterUserDto) {
    return await this.userService.register(register);
  }

  @ApiQuery({
    name: 'address',
    type: String,
    description: '邮箱地址',
    required: true,
    example: 'xx@xx.com',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '发送成功',
    type: String,
  })
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

  @ApiBody({
    type: LoginUserDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '用户名或密码错误 | 用户不存在',
    type: String,
  })
  @Post('login')
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

  @ApiQuery({
    name: 'refreshToken',
    type: String,
    description: '刷新token',
    required: true,
    example: 'xxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'token 已失效',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '刷新成功',
    type: RefreshTokenVo,
  })
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

  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取用户信息',
    type: UserDetailVo,
  })
  @ApiBearerAuth('bearer')
  @Get('info')
  @RequireLogin()
  async info(@UserInfo('id') userId: number) {
    console.log('userInfo', userId);
    return await this.userService.findUserDetailById(userId);
  }

  @ApiBody({
    type: UpdateUserPasswordDto,
  })
  @ApiResponse({
    type: String,
    description: '验证码已失效/验证码不正确/',
  })
  @Post(['update_password', 'admin/update_password'])
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(passwordDto);
  }

  @Get('update_password/captcha')
  @ApiQuery({
    name: 'address',
    description: '邮箱地址',
    type: String,
  })
  @ApiResponse({
    type: String,
    description: '发送成功',
  })
  async updatePasswordCaptcha(@Query('address') address: string) {
    return await this.userService.updatePasswordCaptcha(address);
  }

  @Post(['update', 'admin/update'])
  @RequireLogin()
  @ApiBearerAuth('bearer')
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '验证码已失效/验证码不正确',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    type: String,
  })
  async update(
    @UserInfo('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(userId, updateUserDto);
  }

  @Get('update/captcha')
  @RequireLogin()
  @ApiBearerAuth('bearer')
  async updateCaptcha(@UserInfo('email') address: string) {
    return await this.userService.sendUpdateUserInfoCaptcha(address);
  }

  @Get('freeze')
  @RequireLogin()
  @RequirePermission('access_of_users')
  @ApiQuery({
    name: 'id',
    type: Number,
    description: '用户id',
  })
  @ApiResponse({
    type: String,
    description: 'success',
  })
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'success';
  }

  @Get('list')
  @ApiBearerAuth('bearer')
  @ApiQuery({
    name: 'pageNo',
    description: '第几页',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页多少条',
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: String,
  })
  @ApiQuery({
    name: 'nickName',
    description: '昵称',
    type: String,
  })
  @ApiQuery({
    name: 'email',
    description: '邮箱',
    type: String,
  })
  @ApiResponse({
    type: String,
    description: '用户列表',
  })
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

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage: storage,
      limits: {
        fileSize: 2 ** 20 * 3,
      },
      fileFilter(req, file, callback) {
        const extname = path.extname(file.originalname);
        if (['.png', '.jpg', '.gif'].includes(extname)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('只能上传图片'), false);
        }
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return file.path;
  }
}
