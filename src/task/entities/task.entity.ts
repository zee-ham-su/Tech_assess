import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskStatus } from '../dto/create-task.dto';
import { Project } from 'src/project/entities/project.entity';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: TaskStatus })
  status: TaskStatus;

  @Prop()
  due_date?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Project;

  @Prop({ default: false })
  deleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
