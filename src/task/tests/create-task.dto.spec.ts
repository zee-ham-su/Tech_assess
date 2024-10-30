import 'reflect-metadata';
import { CreateTaskDto, TaskStatus } from '../dto/create-task.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';

describe('CreateTaskDto', () => {
  it('should be defined', () => {
    const dto = new CreateTaskDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    const dtoData = {
      title: 'Sample Task',
      description: 'This is a sample task description.',
      status: TaskStatus.PENDING,
      due_date: new Date().toISOString(),
      project: new Types.ObjectId().toHexString(),
    };

    const dto = plainToInstance(CreateTaskDto, dtoData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate empty title', async () => {
    const dto = new CreateTaskDto();
    dto.title = '';
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.IN_PROGRESS;
    dto.due_date = new Date();
    dto.project = new Types.ObjectId().toHexString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate missing title', async () => {
    const dto = new CreateTaskDto();
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.COMPLETED;
    dto.due_date = new Date();
    dto.project = new Types.ObjectId().toHexString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-string title', async () => {
    const dto = new CreateTaskDto();
    // @ts-ignore
    dto.title = 123;
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.PENDING;
    dto.due_date = new Date();
    dto.project = new Types.ObjectId().toHexString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-enum status', async () => {
    const dto = new CreateTaskDto();
    dto.title = 'Sample Task';
    dto.description = 'This is a sample task description.';
    // @ts-ignore
    dto.status = 'invalid-status';
    dto.due_date = new Date();
    dto.project = new Types.ObjectId().toHexString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid due_date format', async () => {
    const dto = new CreateTaskDto();
    dto.title = 'Sample Task';
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.PENDING;
    // @ts-ignore
    dto.due_date = 'invalid-date';
    dto.project = new Types.ObjectId().toHexString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate missing project', async () => {
    const dto = new CreateTaskDto();
    dto.title = 'Sample Task';
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.IN_PROGRESS;
    dto.due_date = new Date();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid project ID', async () => {
    const dto = new CreateTaskDto();
    dto.title = 'Sample Task';
    dto.description = 'This is a sample task description.';
    dto.status = TaskStatus.COMPLETED;
    dto.due_date = new Date();
    // @ts-ignore
    dto.project = 'invalid-id';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
