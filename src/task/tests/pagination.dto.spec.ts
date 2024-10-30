import 'reflect-metadata';
import { PaginationDto } from '../dto/pagination.dto';
import { validate } from 'class-validator';

describe('PaginationDto', () => {
  it('should be defined', () => {
    const dto = new PaginationDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO with all properties', async () => {
    const dto = new PaginationDto();
    dto.page = 2;
    dto.limit = 10;
    dto.sort = 'asc';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with some properties', async () => {
    const dto = new PaginationDto();
    dto.page = 1;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = new PaginationDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate non-number page', async () => {
    const dto = new PaginationDto();
    (dto as any).page = 'invalid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-number limit', async () => {
    const dto = new PaginationDto();
    (dto as any).limit = 'invalid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-string sort', async () => {
    const dto = new PaginationDto();
    (dto as any).sort = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid sort value', async () => {
    const dto = new PaginationDto();
    dto.sort = 'invalid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
