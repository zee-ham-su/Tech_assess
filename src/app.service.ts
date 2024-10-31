import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getWelcomeMessage(): string {
    return 'Welcome to the Task Management API! Use /api/v1 for available endpoints.Thank you!';
  }
}
