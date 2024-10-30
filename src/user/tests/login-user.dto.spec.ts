import { LoginUserDto } from '../dto/login-user.dto';
import { validate } from 'class-validator';

describe('LoginUserDto', () => {
  it('should be defined', () => {
    const dto = new LoginUserDto();
    expect(dto).toBeDefined();
  });

  it('should validate a valid DTO', async () => {
    const dto = new LoginUserDto();
    dto.email = 'test@example.com';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate empty email', async () => {
    const dto = new LoginUserDto();
    dto.email = '';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate invalid email format', async () => {
    const dto = new LoginUserDto();
    dto.email = 'invalid-email';
    dto.password = 'securepassword';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should invalidate empty password', async () => {
    const dto = new LoginUserDto();
    dto.email = 'test@example.com';
    dto.password = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
