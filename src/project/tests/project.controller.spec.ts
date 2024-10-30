import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../project.controller';
import { ProjectService } from '../project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Project } from '../entities/project.entity';
import { getModelToken } from '@nestjs/mongoose';

describe('ProjectController', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        ProjectService,
        { provide: getModelToken('Project'), useValue: {} },
        { provide: 'CACHE_MANAGER', useValue: {} },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ProjectController', () => {
    let controller: ProjectController;
    let service: ProjectService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [ProjectController],
        providers: [
          {
            provide: ProjectService,
            useValue: {
              create: jest.fn(),
              findAll: jest.fn(),
              findOne: jest.fn(),
              update: jest.fn(),
              remove: jest.fn(),
              softDelete: jest.fn(),
            },
          },
        ],
      }).compile();

      controller = module.get<ProjectController>(ProjectController);
      service = module.get<ProjectService>(ProjectService);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    describe('create', () => {
      it('should create a project', async () => {
        const createProjectDto: CreateProjectDto = { name: 'Test Project' };
        const req = { user: { userId: 'userId' } };
        const result = { id: '1', ...createProjectDto };

        jest.spyOn(service, 'create').mockResolvedValue(result as Project);

        expect(await controller.create(createProjectDto, req)).toBe(result);
      });
    });

    describe('findAll', () => {
      it('should return an array of projects', async () => {
        const req = { user: { userId: 'userId' } };
        const result = [{ id: '1', name: 'Test Project' }];

        jest.spyOn(service, 'findAll').mockResolvedValue(result as Project[]);

        expect(await controller.findAll(req)).toBe(result);
      });
    });

    describe('findOne', () => {
      it('should return a single project', async () => {
        const result = { id: '1', name: 'Test Project' };

        jest.spyOn(service, 'findOne').mockResolvedValue(result as Project);

        expect(await controller.findOne('1')).toBe(result);
      });
    });

    describe('update', () => {
      it('should update a project', async () => {
        const updateProjectDto: UpdateProjectDto = { name: 'Updated Project' };
        const result = { id: '1', ...updateProjectDto };

        jest.spyOn(service, 'update').mockResolvedValue(result as Project);

        expect(await controller.update('1', updateProjectDto)).toBe(result);
      });
    });

    describe('remove', () => {
      it('should remove a project', async () => {
        const result = { message: 'Project removed' };

        jest.spyOn(service, 'remove').mockResolvedValue(result);

        expect(await controller.remove('1')).toBe(result);
      });
    });

    describe('softDelete', () => {
      it('should soft delete a project', async () => {
        const result = { message: 'Project soft deleted' };

        jest.spyOn(service, 'softDelete').mockResolvedValue(result);

        expect(await controller.softDelete('1')).toBe(result);
      });
    });
  });
});
