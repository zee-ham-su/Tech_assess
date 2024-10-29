import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskSchema } from './entities/task.entity';
import { ProjectModule } from 'src/project/project.module';
import { UserModule } from 'src/user/user.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register(),
    MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }]),
    ProjectModule,
    UserModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
