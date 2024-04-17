import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMeetingRoomDto {
  @ApiProperty({
    description: '会议室名称',
    example: '火星',
  })
  @IsNotEmpty({
    message: '会议室名称不能为空',
  })
  @MaxLength(10, {
    message: '会议室名称不能超过10个字符',
  })
  name: string;

  @IsNotEmpty({
    message: '容量不能为空',
  })
  capacity: number;

  @IsNotEmpty({
    message: '会议室位置不能为空',
  })
  @MaxLength(50, {
    message: '会议室位置不能超过50个字符',
  })
  location: string;
  @IsNotEmpty({
    message: '设备不能为空',
  })
  @MaxLength(50, {
    message: '设备不能超过50个字符',
  })
  equipment: string;

  @IsNotEmpty({
    message: '描述不能为空',
  })
  @MaxLength(50, {
    message: '描述不能超过50个字符',
  })
  description: string;
}
