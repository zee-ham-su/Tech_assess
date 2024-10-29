import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsMongoId,
} from 'class-validator';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @IsNotEmpty()
  @IsMongoId()
  project: string;
}
