import 'reflect-metadata';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { validate } from 'class-validator';
import { TaskStatus } from '../dto/create-task.dto';
import { plainToInstance } from 'class-transformer';

describe('UpdateTaskDto', () => {
  it('should be defined', () => {
    const dto = new UpdateTaskDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO with all properties', async () => {
    const dtoData = {
      title: 'Updated Task',
      description: 'Updated description.',
      status: TaskStatus.COMPLETED,
      due_date: new Date().toISOString(),
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with some properties', async () => {
    const dtoData = {
      title: 'Updated Task',
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateTaskDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate non-string title', async () => {
    const dtoData = {
      title: 456,
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-string description', async () => {
    const dtoData = {
      description: false,
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid status value', async () => {
    const dtoData = {
      status: 'invalid-status',
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid due_date format', async () => {
    const dtoData = {
      due_date: 'invalid-date',
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate empty title when provided', async () => {
    const dtoData = {
      title: '',
      description: 'An updated project description',
    };
    const dto = plainToInstance(UpdateTaskDto, dtoData);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
