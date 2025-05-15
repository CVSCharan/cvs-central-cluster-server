import { Router } from "express";
import projectController from "../controllers/projectController";
import { auth, adminOnly } from "../middleware/authMiddleware";

const router = Router();

// Get all projects
router.get("/", projectController.getAllProjects.bind(projectController));
router.get(
  "/active",
  projectController.getActiveProjects.bind(projectController)
);
router.get(
  "/featured",
  projectController.getFeaturedProjects.bind(projectController)
);

// Get project by ID
router.get("/id/:id", projectController.getProjectById.bind(projectController));

// Get project by slug
router.get(
  "/slug/:slug",
  projectController.getProjectBySlug.bind(projectController)
);

// Create a new project
router.post(
  "/",
  auth,
  adminOnly,
  projectController.createProject.bind(projectController)
);

// Update a project
router.put(
  "/:id",
  auth,
  adminOnly,
  projectController.updateProject.bind(projectController)
);

// Delete a project
router.delete(
  "/:id",
  auth,
  adminOnly,
  projectController.deleteProject.bind(projectController)
);

// Toggle project featured status
router.patch(
  "/:id/toggle-featured",
  auth,
  adminOnly,
  projectController.toggleFeatured.bind(projectController)
);

// Toggle project active status
router.patch(
  "/:id/toggle-active",
  auth,
  adminOnly,
  projectController.toggleActive.bind(projectController)
);

export default router;
