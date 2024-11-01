import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './entities/task.entity';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProjectService } from '../project/project.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private projectService: ProjectService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const project = await this.projectService.findOne(createTaskDto.project);
    if (project.owner.toString() !== createTaskDto['user']) {
      throw new ForbiddenException('User does not own this project');
    }
    const newTask = await this.taskModel.create(createTaskDto);
    await this.cacheManager.del('tasks');
    return newTask;
  }

  async findAll(
    userId: string,
    filterTaskDto: FilterTaskDto,
    paginationDto: PaginationDto,
  ): Promise<{ tasks: Task[]; total: number }> {
    const cacheKey = `tasks:${userId}:${JSON.stringify(filterTaskDto)}:${JSON.stringify(paginationDto)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult as { tasks: Task[]; total: number };
    }

    const { status, due_date } = filterTaskDto;
    const { page, limit } = paginationDto;

    const filter: any = { deleted: false, user: userId };
    if (status) filter.status = status;
    if (due_date) filter.due_date = { $lte: due_date };

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.taskModel.countDocuments(filter),
    ]);

    const result = { tasks, total };
    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  async findOne(
    id: string,
    userId: string,
    includedDeleted = false,
  ): Promise<Task> {
    const query = includedDeleted
      ? { user: userId }
      : { user: userId, deleted: false };
    const task = await this.taskModel.findOne({ _id: id, ...query }).exec();
    if (!task)
      throw new NotFoundException(
        `Task with ID ${id} not found or not accessible`,
      );
    return task;
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    await this.findOne(id, userId);
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    return updatedTask;
  }

  async bulkUpdateStatus(
    userId: string,
    taskIds: string[],
    status: TaskStatus,
  ): Promise<Task[]> {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException('Invalid status provided');
    }

    const result = await this.taskModel.updateMany(
      { _id: { $in: taskIds }, user: userId },
      { $set: { status } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException(
        'No accessible tasks found for the provided IDs',
      );
    }

    return this.taskModel.find({ _id: { $in: taskIds }, user: userId }).exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.taskModel
      .findOneAndDelete({ _id: id, user: userId })
      .exec();
    if (!result)
      throw new NotFoundException(
        `Task with ID ${id} not found or not accessible`,
      );
  }

  async softDelete(id: string, userId: string): Promise<{ message: string }> {
    const result = await this.taskModel
      .findOneAndUpdate(
        { _id: id, user: userId },
        { deleted: true },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException(
        `Task with ID ${id} not found or not accessible`,
      );
    }
    return { message: `Task with ID ${id} soft deleted` };
  }
}
