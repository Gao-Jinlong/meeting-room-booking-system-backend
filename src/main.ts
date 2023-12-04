import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor());
  app.useGlobalInterceptors(new InvokeRecordInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('meeting-room-booking-system-backend')
    .setDescription('The API description')
    .setVersion('0.1')
    .addTag('meeting')
    .addBearerAuth({
      type: 'http',
      description: 'jwt auth',
      name: 'bearer',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);

  await app.listen(configService.get('nest_port'));
}
bootstrap();
