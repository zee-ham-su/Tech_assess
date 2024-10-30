import { BulkUpdateStatusDto } from '../dto/bulk-update-status.dto';
import { TaskStatus } from '../dto/create-task.dto';
import { validate } from 'class-validator';

describe('BulkUpdateStatusDto', () => {
  it('should be defined', () => {
    const dto = new BulkUpdateStatusDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    const dto = new BulkUpdateStatusDto();
    dto.task_ids = ['60d0fe4f5311236168a109ca', '60d0fe4f5311236168a109cb'];
    dto.status = TaskStatus.COMPLETED;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate non-array task_ids', async () => {
    const dto = new BulkUpdateStatusDto();
    // @ts-ignore
    dto.task_ids = 'invalid';
    dto.status = TaskStatus.PENDING;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate task_ids with non-string elements', async () => {
    const dto = new BulkUpdateStatusDto();
    // @ts-ignore
    dto.task_ids = [123, '60d0fe4f5311236168a109cb'];
    dto.status = TaskStatus.IN_PROGRESS;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate missing task_ids', async () => {
    const dto = new BulkUpdateStatusDto();
    dto.status = TaskStatus.PENDING;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate missing status', async () => {
    const dto = new BulkUpdateStatusDto();
    dto.task_ids = ['60d0fe4f5311236168a109ca'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid status value', async () => {
    const dto = new BulkUpdateStatusDto();
    dto.task_ids = ['60d0fe4f5311236168a109ca'];
    // @ts-ignore
    dto.status = 'invalid-status';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
