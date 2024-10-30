import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}
