import { db } from '@ai-workbench-frontend/database';
import { ProjectRepository } from '@ai-workbench-frontend/database';
import { TaskRepository } from '@ai-workbench-frontend/database';
import { NewProject, NewTask } from '@ai-workbench-frontend/database';

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private taskRepo: TaskRepository
  ) {}

  // Create project with initial tasks (transactional)
  async createWithTasks(
    projectData: NewProject,
    initialTasks: Array<Omit<NewTask, 'projectId'>>
  ): Promise<{ projectId: string; taskIds: string[] }> {
    return db.transaction(async (tx) => {
      // Create project
      const project = await this.projectRepo.create(projectData);
      
      // Create tasks
      const taskIds = await Promise.all(initialTasks.map(async (task) => {
        const created = await this.taskRepo.create({
          ...task,
          projectId: project.id,
        });
        return created.id;
      }));

      return { projectId: project.id, taskIds };
    });
  }

  // Delete project with all related data
  async deleteProjectCascade(projectId: string): Promise<void> {
    return db.transaction(async () => {
      // Soft delete all tasks
      const projectTasks = await this.taskRepo.findByProject(projectId);
      await Promise.all(projectTasks.map(task => this.taskRepo.softDelete(task.id)));

      // Delete project (agents will be cascade deleted via FK)
      await this.projectRepo.delete(projectId);
    });
  }
}
