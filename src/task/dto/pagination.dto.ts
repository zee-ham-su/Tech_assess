import { IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sort?: string;
}
