import { Request, Response } from 'express';
import projectService from '../services/projectService';
import logger from '../utils/logger';

export class ProjectController {
  /**
   * Get all projects
   */
  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const projects = await projectService.getAllProjects(req.query);
      res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error: any) {
      logger.error('Controller error getting all projects', { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.getProjectById(req.params.id);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error: any) {
      logger.error(`Controller error getting project with id: ${req.params.id}`, { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.getProjectBySlug(req.params.slug);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error: any) {
      logger.error(`Controller error getting project with slug: ${req.params.slug}`, { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.createProject(req.body);
      
      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error: any) {
      logger.error('Controller error creating project', { error, body: req.body });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update a project
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.updateProject(req.params.id, req.body);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error: any) {
      logger.error(`Controller error updating project with id: ${req.params.id}`, { error, body: req.body });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.deleteProject(req.params.id);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error: any) {
      logger.error(`Controller error deleting project with id: ${req.params.id}`, { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  /**
   * Toggle project featured status
   */
  async toggleFeatured(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.toggleFeatured(req.params.id);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
        message: `Project featured status set to ${project.isFeatured}`
      });
    } catch (error: any) {
      logger.error(`Controller error toggling featured status for project with id: ${req.params.id}`, { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  /**
   * Toggle project active status
   */
  async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const project = await projectService.toggleActive(req.params.id);
      
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
        message: `Project active status set to ${project.isActive}`
      });
    } catch (error: any) {
      logger.error(`Controller error toggling active status for project with id: ${req.params.id}`, { error });
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }
}

export default new ProjectController();