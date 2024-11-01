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
    await this.cacheManager.del(`projects:${userId}`); // Clear cache after creation
    return newProject;
  }

  async findAll(owner: string): Promise<Project[]> {
    if (!Types.ObjectId.isValid(owner)) {
      throw new BadRequestException('Invalid owner ID');
    }

    const cacheKey = `projects:${owner}`;
    const cacheProjects = await this.cacheManager.get<Project[]>(cacheKey);
    if (cacheProjects) {
      return cacheProjects;
    }
    const projects = await this.projectModel
      .find({ owner, deleted: { $ne: true } })
      .exec();
    await this.cacheManager.set(cacheKey, projects, 600);
    return projects;
  }

  async findOne(id: string): Promise<Project> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project ID');
    }

    const project = await this.projectModel
      .findOne({ _id: id, deleted: { $ne: true } })
      .exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectModel.findOne({ _id: id, owner: userId });
    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have access',
      );
    }
    Object.assign(project, updateProjectDto);
    await project.save();
    return project;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const project = await this.projectModel.findOneAndDelete({
      _id: id,
      owner: userId,
    });
    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have access',
      );
    }
    return { message: 'Project deleted successfully' };
  }

  async softDelete(id: string, userId: string): Promise<{ message: string }> {
    const project = await this.projectModel.findOneAndUpdate(
      { _id: id, owner: userId },
      { deleted: true },
      { new: true },
    );
    if (!project) {
      throw new NotFoundException(
        'Project not found or you do not have access',
      );
    }
    return { message: 'Project soft deleted successfully' };
  }
}
