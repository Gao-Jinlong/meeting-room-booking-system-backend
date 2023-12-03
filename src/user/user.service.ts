import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
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

@Injectable()
export class UserService {
  @Inject(RedisService)
  private redisService: RedisService;
  @Inject(JwtService)
  private jwtService: JwtService;
  @Inject(ConfigService)
  private configService: ConfigService;
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
}
