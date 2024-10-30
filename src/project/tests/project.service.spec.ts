import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectService } from '../project.service';
import { Project } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Cache } from 'cache-manager';
import { Model, Types } from 'mongoose';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectModel: Model<Project>;
  let cacheManager: Cache;

  // Mocking the Project model
  const mockProjectModel = {
    create: jest.fn().mockResolvedValue({ save: jest.fn() }),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  // Mocking the Cache manager
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getModelToken(Project.name), useValue: mockProjectModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectModel = module.get<Model<Project>>(getModelToken(Project.name));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if userId is invalid', async () => {
      await expect(
        service.create({} as CreateProjectDto, 'invalidId'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a new project', async () => {
      const createProjectDto: CreateProjectDto = { name: 'Test Project' };
      const userId = new Types.ObjectId().toHexString();
      const createdProject = { ...createProjectDto, owner: userId };
      mockProjectModel.create.mockResolvedValue(createdProject);

      const result = await service.create(createProjectDto, userId);

      expect(mockProjectModel.create).toHaveBeenCalledWith({
        ...createProjectDto,
        owner: userId,
      });
      expect(result).toEqual(createdProject);
    });
  });

  describe('findAll', () => {
    it('should return projects from cache if available', async () => {
      const owner = 'ownerId';
      const cachedProjects = [{ name: 'Cached Project' }];
      mockCacheManager.get.mockResolvedValue(cachedProjects);

      const result = await service.findAll(owner);

      expect(result).toEqual(cachedProjects);
    });

    it('should return projects from database if not in cache', async () => {
      const owner = 'ownerId';
      const projects = [{ name: 'DB Project' }];
      mockCacheManager.get.mockResolvedValue(null);
      mockProjectModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(projects),
      });

      const result = await service.findAll(owner);

      expect(result).toEqual(projects);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `projects:${owner}`,
        projects,
        600,
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the project if found', async () => {
      const project = { name: 'Test Project' };
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(project),
      });

      const result = await service.findOne('validId');

      expect(result).toEqual(project);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('invalidId', {} as UpdateProjectDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return the project if found', async () => {
      const project = { name: 'Updated Project' };
      mockProjectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(project),
      });

      const result = await service.update('validId', {} as UpdateProjectDto);

      expect(result).toEqual(project);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and return a success message if project found', async () => {
      const project = { name: 'Deleted Project' };
      mockProjectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(project),
      });

      const result = await service.remove('validId');

      expect(result).toEqual({ message: 'Project deleted successfully' });
    });
  });

  describe('softDelete', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.softDelete('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should soft delete and return a success message if project found', async () => {
      const project = { name: 'Soft Deleted Project' };
      mockProjectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(project),
      });

      const result = await service.softDelete('validId');

      expect(result).toEqual({ message: 'Project soft deleted successfully' });
    });
  });
});
