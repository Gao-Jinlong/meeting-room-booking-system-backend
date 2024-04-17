import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '一层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 20;
    room3.equipment = '电视、白板';
    room3.location = '二层东';

    this.repository.insert([room1, room2, room3]);
  }

  async findAll(pageNo: number, pageSize: number) {
    if (pageNo < 1) {
      throw new BadRequestException('pageNo must be greater than 0');
    }

    const skipCount = (pageNo - 1) * pageSize;

    const [meetingRooms, totalCount] = await this.repository.findAndCount({
      skip: skipCount,
      take: pageSize,
    });

    return {
      meetingRooms,
      totalCount,
    };
  }

  async create(createMeetingRoomDto: CreateMeetingRoomDto) {
    await this.validateName(createMeetingRoomDto.name);

    const meetingRoom = new MeetingRoom();
    meetingRoom.name = createMeetingRoomDto.name;
    meetingRoom.capacity = createMeetingRoomDto.capacity;
    meetingRoom.location = createMeetingRoomDto.location;
    meetingRoom.equipment = createMeetingRoomDto.equipment;
    meetingRoom.description = createMeetingRoomDto.description;

    const res = await this.repository.insert(meetingRoom);

    return res.generatedMaps;
  }

  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    await this.validateName(meetingRoomDto.name);

    const meetingRoom = await this.repository.findOneBy({
      id: meetingRoomDto.id,
    });

    if (!meetingRoom) {
      throw new BadRequestException('room not found');
    }

    meetingRoom.name = meetingRoomDto.name;
    meetingRoom.capacity = meetingRoomDto.capacity;
    meetingRoom.location = meetingRoomDto.location;
    meetingRoom.equipment = meetingRoomDto.equipment;
    meetingRoom.description = meetingRoomDto.description;

    const res = await this.repository.update(
      {
        id: meetingRoom.id,
      },
      meetingRoom,
    );

    return res.affected;
  }

  async validateName(name: string) {
    const room = await this.repository.findOneBy({
      name: name,
    });

    if (room) {
      throw new BadRequestException('room already exists');
    }
  }
}
