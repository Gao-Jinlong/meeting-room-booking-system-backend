import { MigrationInterface, QueryRunner } from 'typeorm';

export class MeetingDatabase1714836982951 implements MigrationInterface {
  name = 'MeetingDatabase1714836982951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`meeting_room\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT '会议室ID', \`name\` varchar(50) NOT NULL COMMENT '会议室名称', \`capacity\` int NOT NULL COMMENT '会议室容量', \`location\` varchar(50) NOT NULL COMMENT '会议室位置', \`equipment\` varchar(50) NOT NULL COMMENT '设备' DEFAULT '', \`description\` varchar(100) NOT NULL COMMENT '描述' DEFAULT '', \`isBooked\` tinyint NOT NULL COMMENT '是否被预定' DEFAULT 0, \`createTime\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), \`updateTime\` datetime(6) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`permissions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(20) NOT NULL COMMENT '权限代码', \`description\` varchar(100) NOT NULL COMMENT '权限描述', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(20) NOT NULL COMMENT '角色名', \`description\` varchar(100) NOT NULL COMMENT '角色描述' DEFAULT '', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(50) NOT NULL COMMENT '用户名', \`password\` varchar(50) NOT NULL COMMENT '密码', \`nick_name\` varchar(50) NOT NULL COMMENT '昵称', \`avatar\` varchar(255) NULL COMMENT '头像', \`email\` varchar(50) NOT NULL COMMENT '邮箱', \`phoneNumber\` varchar(20) NULL COMMENT '手机号', \`isFrozen\` tinyint NOT NULL COMMENT '是否冻结' DEFAULT 0, \`isAdmin\` tinyint NOT NULL COMMENT '是否是管理员' DEFAULT 0, \`createTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateTime\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`booking\` (\`id\` int NOT NULL AUTO_INCREMENT, \`startTime\` datetime NOT NULL COMMENT '会议开始时间', \`endTime\` datetime NOT NULL COMMENT '会议结束时间', \`status\` varchar(20) NOT NULL COMMENT '状态（申请中、审批通过、审批驳回、已解除）' DEFAULT '申请中', \`note\` varchar(100) NOT NULL COMMENT '备注' DEFAULT '', \`createTime\` datetime(6) NOT NULL COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6), \`updateTime\` datetime(6) NOT NULL COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, \`roomId\` int NULL COMMENT '会议室ID', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`role_permissions\` (\`rolesId\` int NOT NULL, \`permissionsId\` int NOT NULL, INDEX \`IDX_0cb93c5877d37e954e2aa59e52\` (\`rolesId\`), INDEX \`IDX_d422dabc78ff74a8dab6583da0\` (\`permissionsId\`), PRIMARY KEY (\`rolesId\`, \`permissionsId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_role\` (\`usersId\` int NOT NULL, \`rolesId\` int NOT NULL, INDEX \`IDX_0d65428bf51c2ce567216427d4\` (\`usersId\`), INDEX \`IDX_5d19ca4692b21d67f692bb837d\` (\`rolesId\`), PRIMARY KEY (\`usersId\`, \`rolesId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking\` ADD CONSTRAINT \`FK_336b3f4a235460dc93645fbf222\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking\` ADD CONSTRAINT \`FK_769a5e375729258fd0bbfc0a456\` FOREIGN KEY (\`roomId\`) REFERENCES \`meeting_room\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_0cb93c5877d37e954e2aa59e52c\` FOREIGN KEY (\`rolesId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_d422dabc78ff74a8dab6583da02\` FOREIGN KEY (\`permissionsId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_role\` ADD CONSTRAINT \`FK_0d65428bf51c2ce567216427d46\` FOREIGN KEY (\`usersId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_role\` ADD CONSTRAINT \`FK_5d19ca4692b21d67f692bb837df\` FOREIGN KEY (\`rolesId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_role\` DROP FOREIGN KEY \`FK_5d19ca4692b21d67f692bb837df\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_role\` DROP FOREIGN KEY \`FK_0d65428bf51c2ce567216427d46\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_d422dabc78ff74a8dab6583da02\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_0cb93c5877d37e954e2aa59e52c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking\` DROP FOREIGN KEY \`FK_769a5e375729258fd0bbfc0a456\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking\` DROP FOREIGN KEY \`FK_336b3f4a235460dc93645fbf222\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5d19ca4692b21d67f692bb837d\` ON \`user_role\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0d65428bf51c2ce567216427d4\` ON \`user_role\``,
    );
    await queryRunner.query(`DROP TABLE \`user_role\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d422dabc78ff74a8dab6583da0\` ON \`role_permissions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0cb93c5877d37e954e2aa59e52\` ON \`role_permissions\``,
    );
    await queryRunner.query(`DROP TABLE \`role_permissions\``);
    await queryRunner.query(`DROP TABLE \`booking\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(`DROP TABLE \`permissions\``);
    await queryRunner.query(`DROP TABLE \`meeting_room\``);
  }
}
