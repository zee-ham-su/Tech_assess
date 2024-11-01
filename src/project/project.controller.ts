import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    const userId = req.user.userId;
    return this.projectService.create(createProjectDto, userId);
  }

  @Get()
  findAll(@Request() req): Promise<Project[]> {
    const userId = req.user.userId;
    return this.projectService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Project> {
    const userId = req.user.userId;
    const project = await this.projectService.findOne(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new NotFoundException('You do not have access to this project');
    }

    return project;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ): Promise<Project> {
    const userId = req.user.userId;
    const project = await this.projectService.findOne(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new NotFoundException(
        'You do not have access to update this project',
      );
    }

    return this.projectService.update(id, updateProjectDto, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    const project = await this.projectService.findOne(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new NotFoundException(
        'You do not have access to delete this project',
      );
    }

    return this.projectService.remove(id, userId);
  }

  @Delete(':id/soft')
  async softDelete(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    const project = await this.projectService.findOne(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner.toString() !== userId) {
      throw new NotFoundException(
        'You do not have access to soft delete this project',
      );
    }

    return this.projectService.softDelete(id, userId);
  }
}
