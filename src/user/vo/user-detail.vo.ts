import { Role } from '../entities/role.entity';

export class UserDetailVo {
  id: number;
  username: string;
  nickName: string;
  email: string;
  phoneNumber: string;
  createTime: Date;
  isFrozen: boolean;
  isAdmin: boolean;
  roles: Role[];
}
