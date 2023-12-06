import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserDetailVo } from './vo/user-detail.vo';
import { EmailService } from 'src/email/email.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  @Inject(RedisService)
  private redisService: RedisService;
  @Inject(JwtService)
  private jwtService: JwtService;
  @Inject(ConfigService)
  private configService: ConfigService;
  @Inject(EmailService)
  private emailService: EmailService;
  private logger = new Logger();

  @InjectRepository(User)
  private userRepository: Repository<User>;
  async register(register: RegisterUserDto) {
    const captcha = await this.redisService.get(`captcha_${register.email}`);

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (captcha !== register.captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.userRepository.findOneBy({
      username: register.username,
    });

    if (foundUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    const newUser = new User();
    newUser.username = register.username;
    newUser.password = md5(register.password);
    newUser.nickName = register.nickName;
    newUser.email = register.email;

    try {
      await this.userRepository.save(newUser);
      return {
        success: true,
      };
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('注册失败', HttpStatus.BAD_REQUEST);
    }
  }

  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    const userInfo = await this.requireUserVo(loginUser, isAdmin);

    const vo = new LoginUserVo();
    vo.userInfo = {
      id: userInfo.id,
      username: userInfo.username,
      nickName: userInfo.nickName,
      email: userInfo.email,
      phoneNumber: userInfo.phoneNumber,
      createTime: userInfo.createTime,
      isFrozen: userInfo.isFrozen,
      isAdmin: userInfo.isAdmin,
      roles: userInfo.roles.map((item) => item.name),
      permissions: userInfo.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) === -1) {
            arr.push(permission);
          }
        });

        return arr;
      }, []),
    };

    const accessToken = await this.generateJwt(
      {
        id: userInfo.id,
        username: userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      this.configService.get<string>('jwt_access_token_expires_time'),
    );

    const refreshToken = await this.generateJwt(
      {
        id: userInfo.id,
      },
      this.configService.get<string>('jwt_refresh_token_expires_time'),
    );

    vo.accessToken = accessToken;
    vo.refreshToken = refreshToken;

    return vo;
  }
  async requireUserVo(loginUser: LoginUserDto, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (user.password !== md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    return user;
  }
  async generateJwt(
    user: Partial<LoginUserVo['userInfo']>,
    expiresIn?: string,
  ) {
    const payload = user;

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt_secret'),
      expiresIn: expiresIn,
    });
  }
  async refreshToken(refreshToken: string) {
    const userInfo = this.jwtService.verify(refreshToken);
    const user = await this.userRepository.findOne({
      where: {
        id: userInfo['id'],
      },
      relations: ['roles', 'roles.permissions'],
    });
    const access_token = await this.generateJwt(
      {
        id: user.id,
        username: user.username,
        roles: user.roles.map((item) => item.name),
        permissions: user.roles
          .map((item) => item.permissions)
          .flat()
          .map((item) => item.code),
      },
      this.configService.get<string>('jwt_access_token_expires_time'),
    );
    const refresh_token = await this.generateJwt(
      {
        id: userInfo.id,
      },
      this.configService.get<string>('jwt_refresh_token_expires_time'),
    );

    return {
      access_token,
      refresh_token,
    };
  }
  async findUserDetailById(userId: number) {
    if (!userId) {
      throw new UnauthorizedException('token 已失效');
    }
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['roles'],
    });

    const vo = new UserDetailVo();
    vo.id = user.id;
    vo.username = user.username;
    vo.nickName = user.nickName;
    vo.email = user.email;
    vo.phoneNumber = user.phoneNumber;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;
    vo.isAdmin = user.isAdmin;
    vo.roles = user.roles;

    return vo;
  }

  getUpdatePasswordEmailCaptchaKey(email: string) {
    return `update_password_captcha_${email}`;
  }
  async updatePassword(userId: number, passwordDto: any) {
    const captcha = await this.redisService.get(
      this.getUpdatePasswordEmailCaptchaKey(passwordDto.email),
    );

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    user.password = md5(passwordDto.password);

    try {
      await this.userRepository.save(user);
      return '修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('修改失败', HttpStatus.BAD_REQUEST);
    }
  }
  async updatePasswordCaptcha(address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      this.getUpdatePasswordEmailCaptchaKey(address),
      code,
      60 * 5,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>您的修改密码验证码为：${code}</p>`,
    });

    return '发送成功';
  }

  getUpdateUserInfoCaptchaKey(email: string) {
    return `update_user_info_captcha_${email}`;
  }
  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      this.getUpdateUserInfoCaptchaKey(updateUserDto.email),
    );

    if (!captcha) {
      throw new HttpException('验证码已过期', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (updateUserDto.nickName) {
      user.nickName = updateUserDto.nickName;
    }
    if (updateUserDto.avatar) {
      user.avatar = updateUserDto.avatar;
    }

    try {
      await this.userRepository.save(user);
      return '修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      throw new HttpException('修改失败', HttpStatus.BAD_REQUEST);
    }
  }
  async sendUpdateUserInfoCaptcha(address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      this.getUpdateUserInfoCaptchaKey(address),
      code,
      60 * 5,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '修改用户信息验证码',
      html: `<p>您的修改用户信息验证码为：${code}</p>`,
    });

    return '发送成功';
  }
}
