import { JwtAuthGuard } from '../jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no user', () => {
    const context = {} as ExecutionContext;
    const result = () => guard.handleRequest(null, null);
    expect(result).toThrow(UnauthorizedException);
  });

  it('should return user if present', () => {
    const user = { userId: 1, email: 'test@example.com' };
    const result = guard.handleRequest(null, user);
    expect(result).toEqual(user);
  });

  it('should throw error if error is present', () => {
    const err = new Error('Test error');
    const result = () => guard.handleRequest(err, null);
    expect(result).toThrow(err);
  });
});
