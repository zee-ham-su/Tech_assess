import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_jwt_secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload correctly', async () => {
    const payload = { userId: 1, email: 'test@example.com' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({ userId: 1, email: 'test@example.com' });
  });
});
