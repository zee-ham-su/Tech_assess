import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from '../task.controller';
import { TaskService } from '../task.service';
import { CreateTaskDto, TaskStatus } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { FilterTaskDto } from '../dto/filter-task.dto';
import { PaginationDto } from '../dto/pagination.dto';

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
    it('should return an array of tasks', async () => {
      const result = {
        tasks: [{ id: '1', title: 'Test Task' }],
        page: 1,
        limit: 10,
      };
      const filterTaskDto: FilterTaskDto = {};
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest.spyOn(taskService, 'findAll').mockResolvedValue(result as any);

      expect(
        await taskController.findAll(filterTaskDto, paginationDto),
      ).toStrictEqual(result);
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
    it('should remove a task', async () => {
      jest.spyOn(taskService, 'remove').mockResolvedValue(undefined); // Expect `void` (undefined) as the return

      await expect(taskController.remove('1')).resolves.toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a task', async () => {
      jest.spyOn(taskService, 'softDelete').mockResolvedValue(undefined); // Expect `void` (undefined) as the return

      await expect(taskController.softDelete('1')).resolves.toBeUndefined();
    });
  });
});
