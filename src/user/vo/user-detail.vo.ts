import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/role.entity';

export class UserDetailVo {
  @ApiProperty()
  id: number;
  @ApiProperty()
  username: string;
  @ApiProperty()
  avatar: string;
  @ApiProperty()
  nickName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  phoneNumber: string;
  @ApiProperty()
  createTime: Date;
  @ApiProperty()
  isFrozen: boolean;
  @ApiProperty()
  isAdmin: boolean;
  @ApiProperty()
  roles: Role[];
}
