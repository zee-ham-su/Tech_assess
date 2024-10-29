import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { PaginationDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get()
  async findAll(
    @Query() filterTaskDto: FilterTaskDto,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.taskService.findAll(filterTaskDto, paginationDto);
    return {
      tasks: result.tasks,
      total: result.total,
      page: paginationDto.page,
      limit: paginationDto.limit,
    };
  }

  @Patch('bulk-update-status')
  @UsePipes(new ValidationPipe({ transform: true }))
  bulkUpdateStatus(@Body() bulkUpdateStatusDto: BulkUpdateStatusDto) {
    return this.taskService.bulkUpdateStatus(
      bulkUpdateStatusDto.task_ids,
      bulkUpdateStatusDto.status,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.taskService.remove(id);
    return {
      message: `Task with ID ${id} deleted`,
    };
  }

  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    await this.taskService.softDelete(id);
    return {
      message: `Task with ID ${id} soft deleted`,
    };
  }
}
