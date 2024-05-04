import { Controller, Get, Inject, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('statistic')
@Controller('statistic')
export class StatisticController {
  @Inject(StatisticService)
  private statisticService: StatisticService;

  @Get('statistic')
  async userBookingCounting(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.statisticService.userBookingCount(startTime, endTime);
  }

  @Get('meetingRoomUsedCount')
  async meetingRomUsedCount(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.statisticService.meetingRoomUsedCount(startTime, endTime);
  }
}
