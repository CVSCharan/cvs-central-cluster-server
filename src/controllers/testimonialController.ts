import { Request, Response } from "express";
import testimonialService from "../services/testimonialService";
import logger from "../utils/logger";

class TestimonialController {
  // Create new testimonial
  async createTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { name, content, rating, avatar, position, company, platform } =
        req.body;

      // Validate required fields
      if (!name || !content || !rating) {
        res
          .status(400)
          .json({ message: "Name, content, and rating are required" });
        return;
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        res.status(400).json({ message: "Rating must be between 1 and 5" });
        return;
      }

      const testimonial = await testimonialService.createTestimonial(userId, {
        name,
        content,
        rating,
        avatar,
        position,
        company,
        platform,
      });

      res.status(201).json({
        message: "Testimonial created successfully",
        testimonial,
      });
    } catch (error) {
      logger.error("Controller error creating testimonial", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error creating testimonial" });
    }
  }

  // Get all testimonials (public)
  async getAllTestimonials(_req: Request, res: Response): Promise<void> {
    try {
      // Only return approved testimonials for public requests
      const testimonials = await testimonialService.getAllTestimonials(true);

      res.status(200).json({ testimonials });
    } catch (error) {
      logger.error("Controller error fetching testimonials", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error fetching testimonials" });
    }
  }

  // Get all testimonials (admin)
  async getAllTestimonialsAdmin(req: Request, res: Response): Promise<void> {
    try {
      // Return all testimonials for admin
      const testimonials = await testimonialService.getAllTestimonials(false);

      res.status(200).json({ testimonials });
    } catch (error) {
      logger.error("Controller error fetching testimonials (admin)", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error fetching testimonials" });
    }
  }

  // Get user's testimonials
  async getUserTestimonials(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;

      const testimonials = await testimonialService.getUserTestimonials(userId);

      res.status(200).json({ testimonials });
    } catch (error) {
      logger.error("Controller error fetching user testimonials", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error fetching testimonials" });
    }
  }

  // Get testimonial by ID
  async getTestimonialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const testimonial = await testimonialService.getTestimonialById(id);

      res.status(200).json({ testimonial });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Testimonial not found") {
        res.status(404).json({ message: errorMessage });
        return;
      }

      logger.error("Controller error fetching testimonial", {
        error: errorMessage,
      });
      res.status(500).json({ message: "Server error fetching testimonial" });
    }
  }

  // Update testimonial
  async updateTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const isAdmin = req.user.isAdmin || false;
      const { name, content, rating, avatar, position, company, platform } =
        req.body;

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        res.status(400).json({ message: "Rating must be between 1 and 5" });
        return;
      }

      const testimonial = await testimonialService.updateTestimonial(
        id,
        userId,
        isAdmin,
        { name, content, rating, avatar, position, company, platform }
      );

      res.status(200).json({
        message: "Testimonial updated successfully",
        testimonial,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Testimonial not found") {
        res.status(404).json({ message: errorMessage });
        return;
      }

      if (errorMessage === "Not authorized to update this testimonial") {
        res.status(403).json({ message: errorMessage });
        return;
      }

      logger.error("Controller error updating testimonial", {
        error: errorMessage,
      });
      res.status(500).json({ message: "Server error updating testimonial" });
    }
  }

  // Delete testimonial
  async deleteTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const isAdmin = req.user.isAdmin || false;

      await testimonialService.deleteTestimonial(id, userId, isAdmin);

      res.status(200).json({ message: "Testimonial deleted successfully" });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Testimonial not found") {
        res.status(404).json({ message: errorMessage });
        return;
      }

      if (errorMessage === "Not authorized to delete this testimonial") {
        res.status(403).json({ message: errorMessage });
        return;
      }

      logger.error("Controller error deleting testimonial", {
        error: errorMessage,
      });
      res.status(500).json({ message: "Server error deleting testimonial" });
    }
  }

  // Admin: Approve or reject testimonial
  async moderateTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      if (isApproved === undefined) {
        res.status(400).json({ message: "isApproved field is required" });
        return;
      }

      const testimonial = await testimonialService.moderateTestimonial(
        id,
        Boolean(isApproved)
      );

      res.status(200).json({
        message: `Testimonial ${
          isApproved ? "approved" : "rejected"
        } successfully`,
        testimonial,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Testimonial not found") {
        res.status(404).json({ message: errorMessage });
        return;
      }

      logger.error("Controller error moderating testimonial", {
        error: errorMessage,
      });
      res.status(500).json({ message: "Server error moderating testimonial" });
    }
  }
}

export default new TestimonialController();
