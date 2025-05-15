import { Testimonial, ITestimonial } from "../models/secondary/Testimonial";
import logger from "../utils/logger";

interface TestimonialInput {
  name: string;
  content: string;
  rating: number;
  avatar?: string;
  isApproved?: boolean;
  position?: string;
  company?: string;
  platform?: string;
}

class TestimonialService {
  // Create a new testimonial
  async createTestimonial(
    userId: string,
    testimonialData: TestimonialInput
  ): Promise<ITestimonial> {
    try {
      logger.info("Creating new testimonial", { userId });

      const testimonial = new Testimonial({
        user: userId,
        ...testimonialData,
        isApproved: false, // Default to not approved
      });

      await testimonial.save();
      logger.info("Testimonial created successfully", {
        testimonialId: testimonial._id,
      });

      return testimonial;
    } catch (error) {
      logger.error("Error creating testimonial", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // Get all testimonials (with optional filter for approved only)
  async getAllTestimonials(
    approvedOnly: boolean = false
  ): Promise<ITestimonial[]> {
    try {
      const filter = approvedOnly ? { isApproved: true } : {};
      logger.info("Fetching testimonials", { approvedOnly });

      const testimonials = await Testimonial.find(filter)
        .populate("user", "name picture")
        .sort({ createdAt: -1 });

      return testimonials;
    } catch (error) {
      logger.error("Error fetching testimonials", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Get all testimonials (with optional filter for approved only)
  async getApprovedTestimonials(
    page: number,
    limit: number,
    skip: number
  ): Promise<{ testimonials: ITestimonial[]; totalCount: number }> {
    try {
      logger.info("Fetching approved testimonials");

      const totalCount = await Testimonial.countDocuments({ isApproved: true });

      const testimonials = await Testimonial.find({ isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name picture");

      return { testimonials, totalCount };
    } catch (error) {
      logger.error("Error fetching approved testimonials", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Get testimonials by user ID
  async getUserTestimonials(userId: string): Promise<ITestimonial[]> {
    try {
      logger.info("Fetching user testimonials", { userId });

      const testimonials = await Testimonial.find({ user: userId }).sort({
        createdAt: -1,
      });

      return testimonials;
    } catch (error) {
      logger.error("Error fetching user testimonials", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // Get testimonial by ID
  async getTestimonialById(testimonialId: string): Promise<ITestimonial> {
    try {
      logger.info("Fetching testimonial by ID", { testimonialId });

      const testimonial = await Testimonial.findById(testimonialId).populate(
        "user",
        "name picture"
      );

      if (!testimonial) {
        logger.warn("Testimonial not found", { testimonialId });
        throw new Error("Testimonial not found");
      }

      return testimonial;
    } catch (error) {
      logger.error("Error fetching testimonial", {
        error: (error as Error).message,
        testimonialId,
      });
      throw error;
    }
  }

  // Update testimonial
  async updateTestimonial(
    testimonialId: string,
    userId: string,
    isAdmin: boolean,
    updateData: Partial<TestimonialInput>
  ): Promise<ITestimonial> {
    try {
      logger.info("Updating testimonial", { testimonialId, userId });

      // Find testimonial
      const testimonial = await Testimonial.findById(testimonialId);

      if (!testimonial) {
        logger.warn("Testimonial not found", { testimonialId });
        throw new Error("Testimonial not found");
      }

      // Check if user owns this testimonial or is admin
      if (!isAdmin && testimonial.user.toString() !== userId) {
        logger.warn("Unauthorized testimonial update attempt", {
          testimonialId,
          userId,
        });
        throw new Error("Not authorized to update this testimonial");
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (key in testimonial && key !== "user" && key !== "isApproved") {
          // @ts-ignore: Dynamic property assignment
          testimonial[key] = updateData[key as keyof TestimonialInput];
        }
      });

      // Only admins can update approval status
      if (isAdmin && updateData.hasOwnProperty("isApproved")) {
        testimonial.isApproved = Boolean(updateData.isApproved);
      }

      await testimonial.save();
      logger.info("Testimonial updated successfully", { testimonialId });

      return testimonial;
    } catch (error) {
      logger.error("Error updating testimonial", {
        error: (error as Error).message,
        testimonialId,
        userId,
      });
      throw error;
    }
  }

  // Delete testimonial
  async deleteTestimonial(
    testimonialId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<boolean> {
    try {
      logger.info("Deleting testimonial", { testimonialId, userId });

      // Find testimonial
      const testimonial = await Testimonial.findById(testimonialId);

      if (!testimonial) {
        logger.warn("Testimonial not found", { testimonialId });
        throw new Error("Testimonial not found");
      }

      // Check if user owns this testimonial or is admin
      if (!isAdmin && testimonial.user.toString() !== userId) {
        logger.warn("Unauthorized testimonial deletion attempt", {
          testimonialId,
          userId,
        });
        throw new Error("Not authorized to delete this testimonial");
      }

      await Testimonial.findByIdAndDelete(testimonialId);
      logger.info("Testimonial deleted successfully", { testimonialId });

      return true;
    } catch (error) {
      logger.error("Error deleting testimonial", {
        error: (error as Error).message,
        testimonialId,
        userId,
      });
      throw error;
    }
  }

  // Admin: Approve or reject testimonial
  async moderateTestimonial(
    testimonialId: string,
    isApproved: boolean
  ): Promise<ITestimonial> {
    try {
      logger.info("Moderating testimonial", { testimonialId, isApproved });

      const testimonial = await Testimonial.findById(testimonialId);

      if (!testimonial) {
        logger.warn("Testimonial not found", { testimonialId });
        throw new Error("Testimonial not found");
      }

      testimonial.isApproved = isApproved;
      await testimonial.save();

      logger.info("Testimonial moderation successful", {
        testimonialId,
        isApproved,
      });
      return testimonial;
    } catch (error) {
      logger.error("Error moderating testimonial", {
        error: (error as Error).message,
        testimonialId,
      });
      throw error;
    }
  }
}

export default new TestimonialService();
