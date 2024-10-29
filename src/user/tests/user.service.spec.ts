import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { IUser } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: jest.Mocked<Model<IUser>>;

  beforeEach(async () => {
    mockUserModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should hash the password and create a new user', async () => {
    const registerUserDto: RegisterUserDto = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    const hashedPassword = 'hashedPassword';
    jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
    mockUserModel.create.mockResolvedValue({
      toObject: () => ({ ...registerUserDto, password: hashedPassword }),
    } as any);

    const result = await service.register(registerUserDto);

    expect(result).toEqual({ ...registerUserDto, password: hashedPassword });
    expect(bcrypt.hash).toHaveBeenCalledWith(registerUserDto.password, 10);
    expect(mockUserModel.create).toHaveBeenCalledWith({
      ...registerUserDto,
      password: hashedPassword,
    });
  });

  it('should find a user by email', async () => {
    const email = 'test@example.com';
    const user = { email, password: 'hashedPassword', username: 'testuser' };
    mockUserModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ toObject: () => user }),
    } as any);

    const result = await service.findByEmail(email);

    expect(result).toEqual(user);
    expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
  });

  it('should compare passwords correctly', async () => {
    const password = 'password123';
    const hashedPassword = 'hashedPassword';
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const result = await service.comparePassword(password, hashedPassword);

    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
  });

  it('should find a user by ID', async () => {
    const id = 'someId';
    const user = {
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
    };
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ toObject: () => user }),
    } as any);

    const result = await service.findById(id);

    expect(result).toEqual(user);
    expect(mockUserModel.findById).toHaveBeenCalledWith(id);
  });

  it('should throw NotFoundException if user not found by ID', async () => {
    const id = 'someId';
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.findById(id)).rejects.toThrow(NotFoundException);
  });

  it('should login a user and return a token', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const user = {
      _id: 'someId',
      email: 'test@example.com',
      password: 'hashedPassword',
      username: 'testuser',
    };
    jest.spyOn(service, 'comparePassword').mockResolvedValue(true as never);
    mockUserModel.findOne.mockResolvedValue(user as any);
    jest.spyOn(service['jwtService'], 'sign').mockReturnValue('token');
    jest.spyOn(service['configService'], 'get').mockReturnValue('secret');

    const result = await service.login(loginUserDto);

    expect(result).toEqual({ token: 'token' });
    expect(mockUserModel.findOne).toHaveBeenCalledWith({
      email: loginUserDto.email,
    });
    expect(service.comparePassword).toHaveBeenCalledWith(
      loginUserDto.password,
      user.password,
    );
    expect(service['jwtService'].sign).toHaveBeenCalledWith(
      { userId: user._id, email: user.email },
      { secret: 'secret' },
    );
  });

  it('should throw UnauthorizedException if login credentials are invalid', async () => {
    const loginUserDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    mockUserModel.findOne.mockResolvedValue(null as any);

    await expect(service.login(loginUserDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
