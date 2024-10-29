import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const newTask = new this.taskModel(createTaskDto);
    const savedTask = await newTask.save();
    await this.cacheManager.del('tasks');
    return savedTask;
  }

  async findAll(
    filterTaskDto: FilterTaskDto,
    paginationDto: PaginationDto,
  ): Promise<{ tasks: Task[]; total: number }> {
    const cacheKey = `tasks:${JSON.stringify(filterTaskDto)}:${JSON.stringify(paginationDto)}`;
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult as { tasks: Task[]; total: number };
    }

    const { status, due_date } = filterTaskDto;
    const { page, limit } = paginationDto;

    const filter: any = { deleted: false };
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
    await this.cacheManager.set(cacheKey, result, 60000); // Cache for 1 minute
    return result;
  }

  async findOne(id: string, includedDeleted = false): Promise<Task> {
    const query = includedDeleted ? {} : { deleted: false };
    const task = await this.taskModel.findById({ _id: id, ...query }).exec();
    if (!task)
      throw new NotFoundException(`Task with ID ${id} not found or deleted`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .exec();
    if (!updatedTask)
      throw new NotFoundException(`Task with ID ${id} not found`);
    return updatedTask;
  }

  async bulkUpdateStatus(
    taskIds: string[],
    status: TaskStatus,
  ): Promise<Task[]> {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestException('Invalid status provided');
    }

    const result = await this.taskModel.updateMany(
      { _id: { $in: taskIds } },
      { $set: { status } },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('No tasks found for the provided IDs');
    }

    return this.taskModel.find({ _id: { $in: taskIds } }).exec();
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Task with ID ${id} not found`);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.taskModel
      .findByIdAndUpdate(id, { deleted: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
