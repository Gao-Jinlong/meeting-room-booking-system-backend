import { Injectable } from '@nestjs/common';
import { User } from './user/entities/user.entity';
import { md5 } from './utils';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  @InjectRepository(User)
  private readonly userRepository;
  @InjectRepository(Permission)
  private readonly permissionRepository;
  @InjectRepository(Role)
  private readonly roleRepository;
  getHello(): string {
    return 'Hello World!';
  }

  async initData() {
    const user1 = new User();
    user1.username = 'ginlon';
    user1.password = md5('123456');
    user1.email = 'ginlon5241@gmail.com';
    user1.isAdmin = true;
    user1.nickName = '金龙';
    user1.phoneNumber = '13611111111';

    const user2 = new User();
    user2.username = 'liming';
    user2.password = md5('654321');
    user2.email = 'yy@yy.com';
    user2.nickName = '李明';

    const admin = new Role();
    admin.name = 'admin';

    const user = new Role();
    user.name = 'user';

    const accessOfUsers = new Permission();
    accessOfUsers.code = 'access_of_users';
    accessOfUsers.description = '用户管理权限';

    const accessOfRoles = new Permission();
    accessOfRoles.code = 'access_of_roles';
    accessOfRoles.description = '角色管理权限';

    user1.roles = [admin];
    user2.roles = [user];

    admin.permissions = [accessOfUsers, accessOfRoles];
    user.permissions = [accessOfUsers];

    await Promise.all([
      this.permissionRepository.save([accessOfUsers, accessOfRoles]),
      this.roleRepository.save([admin, user]),
      this.userRepository.save([user1, user2]),
    ]);
  }
}
