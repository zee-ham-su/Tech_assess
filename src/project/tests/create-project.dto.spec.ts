import { CreateProjectDto } from '../dto/create-project.dto';
import { validate } from 'class-validator';

describe('CreateProjectDto', () => {
  it('should be defined', () => {
    const dto = new CreateProjectDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    const dto = new CreateProjectDto();
    dto.name = 'Project Alpha';
    dto.description = 'A sample project';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate empty name', async () => {
    const dto = new CreateProjectDto();
    dto.name = '';
    dto.description = 'A sample project';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-string name', async () => {
    const dto = new CreateProjectDto();
    // @ts-ignore
    dto.name = 123;
    dto.description = 'A sample project';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate when description is omitted', async () => {
    const dto = new CreateProjectDto();
    dto.name = 'Project Alpha';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate non-string description', async () => {
    const dto = new CreateProjectDto();
    dto.name = 'Project Alpha';
    // @ts-ignore
    dto.description = 456;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
