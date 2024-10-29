import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TaskService } from '../task.service';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, TaskStatus } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { FilterTaskDto } from '../dto/filter-task.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';


describe('TaskService', () => {
  let service: TaskService;
  let taskModel: Model<Task>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const mockTaskModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(true),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getModelToken(Task.name),
          useValue: {
            new: mockTaskModel,
            create: jest.fn().mockImplementation((dto) => ({
              ...dto,
              save: jest.fn().mockResolvedValue({ id: '1', ...dto }),
            })),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            updateMany: jest.fn(),
            countDocuments: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskModel = module.get<Model<Task>>(getModelToken(Task.name));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
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
        project: 'Test Project',
      };
      const result = { id: '1', ...createTaskDto };

      jest.spyOn(taskModel, 'create').mockResolvedValue(result as any);

      expect(await service.create(createTaskDto)).toBe(result);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = { tasks: [{ id: '1', title: 'Test Task' }], total: 1 };
      const filterTaskDto: FilterTaskDto = { status: TaskStatus.PENDING };
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest.spyOn(taskModel, 'find').mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(result.tasks),
      } as any);
      jest.spyOn(taskModel, 'countDocuments').mockResolvedValue(result.total);

      expect(await service.findAll(filterTaskDto, paginationDto)).toEqual(
        result,
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      const task = {
        title: 'Test Task',
        description: 'Test Description',
        _id: '1',
      };

      jest.spyOn(taskModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(task),
      } as any);

      const result = await service.findOne('1');
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task by ID', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const updatedTask = { ...updateTaskDto, _id: '1' };

      jest.spyOn(taskModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedTask),
      } as any);

      const result = await service.update('1', updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };

      jest.spyOn(taskModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.update('1', updateTaskDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update the status of multiple tasks', async () => {
      const taskIds = ['1', '2'];
      const status = TaskStatus.IN_PROGRESS;
      const tasks = [
        { title: 'Task 1', status, _id: '1' },
        { title: 'Task 2', status, _id: '2' },
      ];

      jest
        .spyOn(taskModel, 'updateMany')
        .mockResolvedValue({ modifiedCount: 2 } as any);
      jest.spyOn(taskModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(tasks),
      } as any);

      const result = await service.bulkUpdateStatus(taskIds, status);
      expect(result).toEqual(tasks);
    });

    it('should throw BadRequestException if invalid status provided', async () => {
      const taskIds = ['1', '2'];
      const status = 'INVALID_STATUS' as TaskStatus;

      await expect(service.bulkUpdateStatus(taskIds, status)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if no tasks found for provided IDs', async () => {
      const taskIds = ['1', '2'];
      const status = TaskStatus.IN_PROGRESS;

      jest
        .spyOn(taskModel, 'updateMany')
        .mockResolvedValue({ modifiedCount: 0 } as any);

      await expect(service.bulkUpdateStatus(taskIds, status)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a task by ID', async () => {
      jest.spyOn(taskModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1' }),
      } as any);

      await expect(service.remove('1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a task by ID', async () => {
      jest.spyOn(taskModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '1' }),
      } as any);

      await expect(service.softDelete('1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.softDelete('1')).rejects.toThrow(NotFoundException);
    });
  });
});
