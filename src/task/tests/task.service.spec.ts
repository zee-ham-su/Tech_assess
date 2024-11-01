import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TaskService } from '../task.service';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, TaskStatus } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { FilterTaskDto } from '../dto/filter-task.dto';
import { PaginationDto } from '../dto/pagination.dto';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { ProjectService } from '../../project/project.service';

describe('TaskService', () => {
  let service: TaskService;
  let taskModel: Model<Task>;
  let cacheManager: Cache;
  let projectService: ProjectService;

  const mockTaskModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockProjectService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskModel = module.get<Model<Task>>(getModelToken(Task.name));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    projectService = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.PENDING,
        project: 'projectId',
      };
      const createdTask = { id: '1', ...createTaskDto };

      mockProjectService.findOne.mockResolvedValue({ owner: 'userId' });
      mockTaskModel.create.mockResolvedValue(createdTask);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(createdTask);
      expect(mockTaskModel.create).toHaveBeenCalledWith(createTaskDto);
      expect(mockCacheManager.del).toHaveBeenCalledWith('tasks');
    });

    it('should throw ForbiddenException if user does not own the project', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.PENDING,
        project: 'projectId',
      };

      mockProjectService.findOne.mockResolvedValue({
        owner: 'differentUserId',
      });

      await expect(service.create(createTaskDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return tasks from cache if available', async () => {
      const cachedResult = {
        tasks: [{ id: '1', title: 'Cached Task' }],
        total: 1,
      };
      const filterTaskDto: FilterTaskDto = {};
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const userId = 'userId';

      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(
        userId,
        filterTaskDto,
        paginationDto,
      );

      expect(result).toEqual(cachedResult);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockTaskModel.find).not.toHaveBeenCalled();
    });

    it('should return tasks from database if not in cache', async () => {
      const tasks = [{ id: '1', title: 'Test Task' }];
      const filterTaskDto: FilterTaskDto = { status: TaskStatus.PENDING };
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const userId = 'userId';

      mockCacheManager.get.mockResolvedValue(null);
      mockTaskModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(tasks),
      });
      mockTaskModel.countDocuments.mockResolvedValue(1);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAll(
        userId,
        filterTaskDto,
        paginationDto,
      );

      expect(result).toEqual({ tasks, total: 1 });
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockTaskModel.find).toHaveBeenCalled();
      expect(mockTaskModel.countDocuments).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      const task = { id: '1', title: 'Test Task' };
      const userId = 'userId';
      mockTaskModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(task),
      });

      const result = await service.findOne('1', userId);

      expect(result).toEqual(task);
      expect(mockTaskModel.findOne).toHaveBeenCalledWith({
        _id: '1',
        user: userId,
        deleted: false,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      const userId = 'userId';
      mockTaskModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const updatedTask = { id: '1', ...updateTaskDto };
      const userId = 'userId';

      mockTaskModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1' }),
      });
      mockTaskModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTask),
      });

      const result = await service.update('1', userId, updateTaskDto);

      expect(result).toEqual(updatedTask);
      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        updateTaskDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      const userId = 'userId';
      mockTaskModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('1', userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update the status of multiple tasks', async () => {
      const taskIds = ['1', '2'];
      const status = TaskStatus.IN_PROGRESS;
      const userId = 'userId';
      const updatedTasks = [
        { id: '1', status },
        { id: '2', status },
      ];

      mockTaskModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
      mockTaskModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTasks),
      });

      const result = await service.bulkUpdateStatus(userId, taskIds, status);

      expect(result).toEqual(updatedTasks);
      expect(mockTaskModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: taskIds }, user: userId },
        { $set: { status } },
      );
      expect(mockTaskModel.find).toHaveBeenCalledWith({
        _id: { $in: taskIds },
        user: userId,
      });
    });

    it('should throw BadRequestException if invalid status provided', async () => {
      const taskIds = ['1', '2'];
      const invalidStatus = 'INVALID_STATUS' as TaskStatus;
      const userId = 'userId';

      await expect(
        service.bulkUpdateStatus(userId, taskIds, invalidStatus),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no tasks found for provided IDs', async () => {
      const taskIds = ['1', '2'];
      const status = TaskStatus.IN_PROGRESS;
      const userId = 'userId';

      mockTaskModel.updateMany.mockResolvedValue({ modifiedCount: 0 });

      await expect(
        service.bulkUpdateStatus(userId, taskIds, status),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const deletedTask = { id: '1', title: 'Deleted Task' };
      const userId = 'userId';

      mockTaskModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedTask),
      });

      await service.remove('1', userId);

      expect(mockTaskModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: '1',
        user: userId,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      const userId = 'userId';
      mockTaskModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete a task', async () => {
      const softDeletedTask = {
        id: '1',
        title: 'Soft Deleted Task',
        deleted: true,
      };
      const userId = 'userId';

      mockTaskModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(softDeletedTask),
      });

      await service.softDelete('1', userId);

      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { deleted: true },
        { new: true },
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      const userId = 'userId';
      mockTaskModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.softDelete('1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
