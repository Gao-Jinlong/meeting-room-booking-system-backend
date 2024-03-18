import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty()
  id: number;
  @ApiProperty({ example: 'ginlon' })
  username: string;
  @ApiProperty({ example: 'ginlon' })
  nickName: string;
  @ApiProperty({ example: 'xx@xx.com' })
  email: string;
  @ApiProperty({ example: '123456' })
  phoneNumber: string;
  @ApiProperty()
  isFrozen: boolean;
  @ApiProperty()
  isAdmin: boolean;
  @ApiProperty()
  createTime: Date;
  @ApiProperty({ example: ['admin'] })
  roles: string[];
  @ApiProperty({ example: 'access_of_users,access_of_roles' })
  permissions: string[];
}
export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}
