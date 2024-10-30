import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from '../task.controller';
import { TaskService } from '../task.service';
import { CreateTaskDto, TaskStatus } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { FilterTaskDto } from '../dto/filter-task.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { BulkUpdateStatusDto } from '../dto/bulk-update-status.dto';
import { Task } from '../entities/task.entity';
import { Project } from '../../project/entities/project.entity';
import { Types } from 'mongoose';

describe('TaskController', () => {
  let taskController: TaskController;
  let taskService: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            bulkUpdateStatus: jest.fn(),
            remove: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    taskController = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(taskController).toBeDefined();
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

      jest.spyOn(taskService, 'create').mockResolvedValue(result as any);

      expect(await taskController.create(createTaskDto)).toBe(result);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks with pagination info', async () => {
      const mockProject: Partial<Project> = {
        _id: 'project1',
        name: 'Test Project',
        description: 'Test Project Description',
        owner: new Types.ObjectId(),
        deleted: false,
      };

      const tasks: Partial<Task>[] = [
        {
          _id: '1',
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.PENDING,
          project: mockProject as Project,
          deleted: false,
        },
      ];
      const total = 1;
      const filterTaskDto: FilterTaskDto = {};
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest
        .spyOn(taskService, 'findAll')
        .mockResolvedValue({ tasks: tasks as Task[], total });

      const result = await taskController.findAll(filterTaskDto, paginationDto);

      expect(result).toEqual({
        tasks,
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
      });
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update status of multiple tasks', async () => {
      const bulkUpdateStatusDto: BulkUpdateStatusDto = {
        task_ids: ['1', '2'],
        status: TaskStatus.IN_PROGRESS,
      };
      const updatedTasks = [
        { id: '1', status: TaskStatus.IN_PROGRESS },
        { id: '2', status: TaskStatus.IN_PROGRESS },
      ];

      jest
        .spyOn(taskService, 'bulkUpdateStatus')
        .mockResolvedValue(updatedTasks as any);

      const result = await taskController.bulkUpdateStatus(bulkUpdateStatusDto);

      expect(result).toBe(updatedTasks);
      expect(taskService.bulkUpdateStatus).toHaveBeenCalledWith(
        bulkUpdateStatusDto.task_ids,
        bulkUpdateStatusDto.status,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = { id: '1', title: 'Test Task' };

      jest.spyOn(taskService, 'findOne').mockResolvedValue(result as any);

      expect(await taskController.findOne('1')).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const result = { id: '1', ...updateTaskDto };

      jest.spyOn(taskService, 'update').mockResolvedValue(result as any);

      expect(await taskController.update('1', updateTaskDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a task and return a success message', async () => {
      jest.spyOn(taskService, 'remove').mockResolvedValue(undefined);

      const result = await taskController.remove('1');

      expect(result).toEqual({ message: 'Task with ID 1 deleted' });
    });
  });

  describe('softDelete', () => {
    it('should soft delete a task and return a success message', async () => {
      jest.spyOn(taskService, 'softDelete').mockResolvedValue(undefined);

      const result = await taskController.softDelete('1');

      expect(result).toEqual({ message: 'Task with ID 1 soft deleted' });
    });
  });
});
