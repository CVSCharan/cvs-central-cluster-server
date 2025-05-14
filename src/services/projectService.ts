import { Project, IProject } from '../models/primary/Project';
import logger from '../utils/logger';

export interface IProjectCreate {
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  image: string;
  technologies: string[];
  features: string[];
  liveUrl?: string;
  githubUrl?: string;
  category: "web" | "mobile" | "design" | "full-stack";
  relatedProjects?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  platform?: string;
}

export interface IProjectUpdate {
  title?: string;
  slug?: string;
  description?: string;
  fullDescription?: string;
  image?: string;
  technologies?: string[];
  features?: string[];
  liveUrl?: string;
  githubUrl?: string;
  category?: "web" | "mobile" | "design" | "full-stack";
  relatedProjects?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  platform?: string;
}

export class ProjectService {
  /**
   * Get all projects
   */
  async getAllProjects(query: any = {}): Promise<IProject[]> {
    try {
      logger.info('Fetching all projects', { query });
      
      // Build filter object based on query parameters
      const filter: any = {};
      
      if (query.category) {
        filter.category = query.category;
      }
      
      if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
      }
      
      if (query.isFeatured !== undefined) {
        filter.isFeatured = query.isFeatured === 'true';
      }
      
      // Add search functionality
      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: 'i' } },
          { description: { $regex: query.search, $options: 'i' } }
        ];
      }
      
      return await Project.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching projects', { error });
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<IProject | null> {
    try {
      logger.info(`Fetching project with id: ${id}`);
      return await Project.findById(id);
    } catch (error) {
      logger.error(`Error fetching project with id: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(slug: string): Promise<IProject | null> {
    try {
      logger.info(`Fetching project with slug: ${slug}`);
      return await Project.findOne({ slug });
    } catch (error) {
      logger.error(`Error fetching project with slug: ${slug}`, { error });
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: IProjectCreate): Promise<IProject> {
    try {
      logger.info('Creating new project', { data });
      
      // Check if slug already exists
      const existingProject = await Project.findOne({ slug: data.slug });
      if (existingProject) {
        throw new Error('A project with this slug already exists');
      }
      
      const project = new Project(data);
      return await project.save();
    } catch (error) {
      logger.error('Error creating project', { error, data });
      throw error;
    }
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: IProjectUpdate): Promise<IProject | null> {
    try {
      logger.info(`Updating project with id: ${id}`, { data });
      
      // If slug is being updated, check if it already exists
      if (data.slug) {
        const existingProject = await Project.findOne({ 
          slug: data.slug,
          _id: { $ne: id } // Exclude current project
        });
        
        if (existingProject) {
          throw new Error('A project with this slug already exists');
        }
      }
      
      return await Project.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error(`Error updating project with id: ${id}`, { error, data });
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<IProject | null> {
    try {
      logger.info(`Deleting project with id: ${id}`);
      return await Project.findByIdAndDelete(id);
    } catch (error) {
      logger.error(`Error deleting project with id: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Toggle project featured status
   */
  async toggleFeatured(id: string): Promise<IProject | null> {
    try {
      const project = await Project.findById(id);
      if (!project) {
        return null;
      }
      
      project.isFeatured = !project.isFeatured;
      return await project.save();
    } catch (error) {
      logger.error(`Error toggling featured status for project with id: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Toggle project active status
   */
  async toggleActive(id: string): Promise<IProject | null> {
    try {
      const project = await Project.findById(id);
      if (!project) {
        return null;
      }
      
      project.isActive = !project.isActive;
      return await project.save();
    } catch (error) {
      logger.error(`Error toggling active status for project with id: ${id}`, { error });
      throw error;
    }
  }
}

export default new ProjectService();