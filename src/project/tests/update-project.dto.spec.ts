import { UpdateProjectDto } from '../dto/update-project.dto';
import { validate } from 'class-validator';

describe('UpdateProjectDto', () => {
  it('should be defined', () => {
    const dto = new UpdateProjectDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO with all properties', async () => {
    const dto = new UpdateProjectDto();
    dto.name = 'Project Beta';
    dto.description = 'An updated project description';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only name', async () => {
    const dto = new UpdateProjectDto();
    dto.name = 'Project Beta';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with only description', async () => {
    const dto = new UpdateProjectDto();
    dto.description = 'An updated project description';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate non-string name', async () => {
    const dto = new UpdateProjectDto();
    // @ts-ignore
    dto.name = 789;
    dto.description = 'An updated project description';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate non-string description', async () => {
    const dto = new UpdateProjectDto();
    dto.name = 'Project Beta';
    // @ts-ignore
    dto.description = true;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate empty name when provided', async () => {
    const dto = new UpdateProjectDto();
    dto.name = '';
    dto.description = 'An updated project description';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
