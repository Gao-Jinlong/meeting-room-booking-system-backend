import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  Put,
} from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { generateParseIntPipe } from 'src/utils';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('meeting-room')
@Controller('meeting-room')
export class MeetingRoomController {
  constructor(private readonly meetingRoomService: MeetingRoomService) {}

  @Get('list')
  @ApiQuery({
    name: 'pageNo',
    type: Number,
    required: false,
    description: '页码',
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    required: false,
    description: '会议室名称',
  })
  @ApiQuery({
    name: 'capacity',
    type: Number,
    required: false,
    description: '容量',
  })
  @ApiQuery({
    name: 'equipment',
    type: String,
    required: false,
    description: '设备',
  })
  findAll(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('name') name?: string,
    @Query('capacity') capacity?: number,
    @Query('equipment') equipment?: string,
  ) {
    return this.meetingRoomService.findAll(
      pageNo,
      pageSize,
      name,
      capacity,
      equipment,
    );
  }

  @Post('')
  @ApiBody({
    type: CreateMeetingRoomDto,
    required: true,
    description: '创建会议室',
    examples: {
      'create-meeting-room-1': {
        value: {
          name: '火星',
          capacity: 10,
          location: '一层西',
          equipment: '白板',
          description: '火星会议室',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '会议室ID',
          example: 1,
        },
        equipment: {
          type: 'string',
          description: '设备',
          example: '白板',
        },
        description: {
          type: 'string',
          description: '描述',
          example: '火星会议室',
        },
        isBooked: {
          type: 'boolean',
          description: '是否被预定',
          example: false,
        },
        createTime: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
          example: '2021-09-01T08:00:00',
        },
        updateTime: {
          type: 'string',
          format: 'date-time',
          description: '更新时间',
          example: '2021-09-01T08:00:00',
        },
      },
    },
  })
  async create(@Body() meetingRoomDto: CreateMeetingRoomDto) {
    return this.meetingRoomService.create(meetingRoomDto);
  }

  @Put('')
  @ApiBody({
    type: UpdateMeetingRoomDto,
    required: true,
    description: '更新会议室',
    examples: {
      'update-meeting-room-1': {
        value: {
          id: 1,
          name: '火星',
          capacity: 10,
          location: '一层西',
          equipment: '白板',
          description: '火星会议室',
        },
      },
    },
  })
  async update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    return this.meetingRoomService.update(meetingRoomDto);
  }

  @Get(':id')
  async find(@Param('id', generateParseIntPipe('id')) id: number) {
    return await this.meetingRoomService.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id', generateParseIntPipe('id')) id: number) {
    return await this.meetingRoomService.delete(id);
  }
}
