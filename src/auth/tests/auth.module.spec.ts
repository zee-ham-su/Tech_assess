import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth.module';
import { AuthService } from '../auth.service';
import { JwtStrategy } from '../jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../../user/user.module';

describe('AuthModule', () => {
  let module: TestingModule;
  let authService: AuthService;
  let jwtStrategy: JwtStrategy;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'testSecretKey', // Mock secret for testing purposes
          signOptions: { expiresIn: '1d' },
        }),
        UserModule,
        AuthModule,
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('AuthService should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('JwtStrategy should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });
});
