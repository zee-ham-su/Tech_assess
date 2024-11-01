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

  const mockProjectModel = {
    create: jest.fn().mockResolvedValue({ save: jest.fn() }),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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
      const ownerId = new Types.ObjectId().toHexString();
      mockCacheManager.get.mockResolvedValue([{ name: 'Cached Project' }]);

      const result = await service.findAll(ownerId);

      expect(result).toEqual([{ name: 'Cached Project' }]);
    });

    it('should return projects from database if not in cache', async () => {
      const ownerId = new Types.ObjectId().toHexString();
      mockCacheManager.get.mockResolvedValue(null);
      mockProjectModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ name: 'DB Project' }]),
      });

      const result = await service.findAll(ownerId);

      expect(result).toEqual([{ name: 'DB Project' }]);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `projects:${ownerId}`,
        [{ name: 'DB Project' }],
        600,
      );
    });
  });

  describe('findOne', () => {
    it('should throw BadRequestException if ID format is invalid', async () => {
      const invalidId = 'invalidObjectId';
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(false);

      await expect(service.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if project not found', async () => {
      const validNonExistentId = new Types.ObjectId().toHexString();
      jest.spyOn(Types.ObjectId, 'isValid').mockReturnValue(true);

      mockProjectModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(validNonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the project if found', async () => {
      const validId = new Types.ObjectId().toHexString();
      const project = { name: 'Test Project' };
      mockProjectModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(project),
      });

      const result = await service.findOne(validId);
      expect(result).toEqual(project);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if project not found', async () => {
      const updateProjectDto: UpdateProjectDto = { name: 'Updated Project' };
      const userId = new Types.ObjectId().toHexString();
      mockProjectModel.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalidId', updateProjectDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return the updated project', async () => {
      const projectId = new Types.ObjectId();
      const ownerId = new Types.ObjectId();
      const existingProject = {
        _id: projectId,
        owner: ownerId,
        name: 'Old Project Name',
        save: jest.fn().mockResolvedValue({
          _id: projectId,
          owner: ownerId,
          name: 'Updated Project',
        }),
      };
      mockProjectModel.findOne.mockResolvedValue(existingProject);

      const updateProjectDto: UpdateProjectDto = { name: 'Updated Project' };
      const result = await service.update(
        projectId.toHexString(),
        updateProjectDto,
        ownerId.toHexString(),
      );

      expect(mockProjectModel.findOne).toHaveBeenCalledWith({
        _id: projectId.toHexString(),
        owner: ownerId.toHexString(),
      });

      expect(existingProject.save).toHaveBeenCalled();

      expect(result).toMatchObject({
        _id: projectId,
        owner: ownerId,
        name: 'Updated Project',
      });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockProjectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('invalidId', 'userId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and return a success message if project found', async () => {
      const projectId = new Types.ObjectId().toHexString();
      const userId = new Types.ObjectId().toHexString();

      mockProjectModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: projectId,
          owner: userId,
          name: 'Deleted Project',
        }),
      });

      const result = await service.remove(projectId, userId);

      expect(result).toEqual({ message: 'Project deleted successfully' });
    });
  });

  describe('softDelete', () => {
    it('should soft delete and return a success message if project found', async () => {
      const projectId = new Types.ObjectId().toHexString();
      const userId = new Types.ObjectId().toHexString();

      mockProjectModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: projectId,
          owner: userId,
          deleted: true,
        }),
      });

      const result = await service.softDelete(projectId, userId);

      expect(result).toEqual({
        message: 'Project soft deleted successfully',
      });
    });
  });
});
