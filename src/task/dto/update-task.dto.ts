import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class UpdateTaskDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}
