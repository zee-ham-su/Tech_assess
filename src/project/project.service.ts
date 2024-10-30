import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const newProject = await this.projectModel.create({
      ...createProjectDto,
      owner: userId,
    });

    return newProject;
  }

  async findAll(owner: string): Promise<Project[]> {
    const cacheKey = `projects:${owner}`;
    const cacheProjects = await this.cacheManager.get<Project[]>(cacheKey);
    if (cacheProjects) {
      return cacheProjects;
    }
    const projects = await this.projectModel.find({ owner }).exec();
    await this.cacheManager.set(cacheKey, projects, 600);
    return projects;
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async remove(id: string): Promise<{ message: string }> {
    const project = await this.projectModel.findByIdAndDelete(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return { message: 'Project deleted successfully' };
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const result = await this.projectModel
      .findByIdAndUpdate(id, { deleted: true })
      .exec();
    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return { message: 'Project soft deleted successfully' };
  }
}
