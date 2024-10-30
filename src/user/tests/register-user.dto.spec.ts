import { RegisterUserDto } from '../dto/register-user.dto';
import { validate } from 'class-validator';

describe('RegisterUserDto', () => {
  it('should be defined', () => {
    const dto = new RegisterUserDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    const dto = new RegisterUserDto();
    dto.username = 'testuser';
    dto.email = 'test@example.com';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate empty username', async () => {
    const dto = new RegisterUserDto();
    dto.username = '';
    dto.email = 'test@example.com';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate empty email', async () => {
    const dto = new RegisterUserDto();
    dto.username = 'testuser';
    dto.email = '';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid email format', async () => {
    const dto = new RegisterUserDto();
    dto.username = 'testuser';
    dto.email = 'invalid-email';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate short password', async () => {
    const dto = new RegisterUserDto();
    dto.username = 'testuser';
    dto.email = 'test@example.com';
    dto.password = '123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
