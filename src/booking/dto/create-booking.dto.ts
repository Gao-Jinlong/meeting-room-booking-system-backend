import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({
    message: '会议室Id不能为空',
  })
  @IsNumber()
  meetingRoomId: number;
  @IsNotEmpty({
    message: '开始时间不能为空',
  })
  @IsDateString({})
  startTime: Date;
  @IsNotEmpty({
    message: '结束时间不能为空',
  })
  @IsDateString({})
  endTime: Date;

  note: string;
}
