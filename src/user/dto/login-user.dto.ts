import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'ginlon',
    name: 'username',
    required: true,
  })
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
    name: 'password',
    required: true,
  })
  @IsNotEmpty({
    message: '密码不能为空',
  })
  password: string;
}
