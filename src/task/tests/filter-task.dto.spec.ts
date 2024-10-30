import 'reflect-metadata';
import { FilterTaskDto } from '../dto/filter-task.dto';
import { TaskStatus } from '../dto/create-task.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('FilterTaskDto', () => {
  it('should be defined', () => {
    const dto = new FilterTaskDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO with all properties', async () => {
    const dtoData = {
      status: TaskStatus.IN_PROGRESS,
      due_date: new Date().toISOString(),
    };
    const dto = plainToInstance(FilterTaskDto, dtoData);

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only status', async () => {
    const dtoData = {
      status: TaskStatus.COMPLETED,
    };
    const dto = plainToInstance(FilterTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only due_date', async () => {
    const dtoData = {
      due_date: new Date().toISOString(),
    };
    const dto = plainToInstance(FilterTaskDto, dtoData);

    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(FilterTaskDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate invalid status value', async () => {
    const dtoData = {
      status: 'invalid-status',
    };
    const dto = plainToInstance(FilterTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid due_date format', async () => {
    const dtoData = {
      due_date: 'invalid-date',
    };
    const dto = plainToInstance(FilterTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
