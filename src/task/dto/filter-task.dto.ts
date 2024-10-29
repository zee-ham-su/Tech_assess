import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class FilterTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}
