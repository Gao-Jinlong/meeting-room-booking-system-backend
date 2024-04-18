import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { generateParseIntPipe } from 'src/utils';
import { IsDateString } from 'class-validator';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UserInfo } from 'src/custom.decorator';

class DateQueryDto {
  @IsDateString()
  date: string;
}

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart')
    bookingTimeRangeStart: string,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: string,
  ) {
    const timeStart: DateQueryDto = {
      date: bookingTimeRangeStart,
    };
    const timeEnd: DateQueryDto = {
      date: bookingTimeRangeEnd,
    };

    return await this.bookingService.find(
      pageNo,
      pageSize,
      username,
      meetingRoomName,
      meetingRoomPosition,
      timeStart.date,
      timeEnd.date,
    );
  }

  @Post()
  @ApiBody({
    type: CreateBookingDto,
  })
  async create(
    @Body() booking: CreateBookingDto,
    @UserInfo('userId') userId: number,
  ) {
    return await this.bookingService.add(booking, userId);
  }

  @Get('apply/:id')
  async apply(@Param('id') id: number) {
    return this.bookingService.apply(id);
  }

  @Get('reject/:id')
  async reject(@Param('id') id: number) {
    return this.bookingService.reject(id);
  }

  @Get('unbind/:id')
  async unbind(@Param('id') id: number) {
    return this.bookingService.unbind(id);
  }

  @Get('urge/:id')
  async urge(@Param('id') id: number) {
    return this.bookingService.urge(id);
  }
}
