import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mocked_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        ConfigService,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  describe('login', () => {
    it('should return a JWT token for valid user', async () => {
      const user = { email: 'test@example.com', _id: '12345' };
      const result = await authService.login(user);
      expect(result).toEqual({ access_token: 'mocked_token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user._id,
      });
    });
  });

  describe('validateUser', () => {
    it('should return user information for valid user', async () => {
      const payload = { email: 'test@example.com' };
      const user = { email: 'test@example.com', _id: '12345' };
      mockUserService.findByEmail.mockResolvedValue(user);

      const result = await authService.validateUser(payload);
      expect(result).toEqual(user);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(payload.email);
    });

    it('should return null for invalid user', async () => {
      const payload = { email: 'nonexistent@example.com' };
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(payload);
      expect(result).toBeNull();
    });
  });
});
