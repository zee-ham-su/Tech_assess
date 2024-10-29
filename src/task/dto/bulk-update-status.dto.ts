import { IsArray, IsString, IsEnum } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class BulkUpdateStatusDto {
  @IsArray()
  @IsString({ each: true })
  task_ids: string[];

  @IsEnum(TaskStatus)
  status: TaskStatus;
}
