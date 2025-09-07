import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getConnection } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    company_name: string;
    full_name: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

class AuthController {
  register = async (req: RegisterRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password, company_name, full_name } = req.body;

      // Validation
      if (!email || !password || !company_name || !full_name) {
        throw createError('All fields are required', 400);
      }

      if (password.length < 6) {
        throw createError('Password must be at least 6 characters long', 400);
      }

      const connection = getConnection();

      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as any[];

      if (existingUsers.length > 0) {
        throw createError('User already exists', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const [result] = await connection.execute(
        `INSERT INTO users (email, password, company_name, full_name) 
         VALUES (?, ?, ?, ?)`,
        [email, hashedPassword, company_name, full_name]
      ) as any[];

      const userId = result.insertId;

      // Generate tokens
      const token = this.generateAccessToken(userId);
      const refreshToken = this.generateRefreshToken(userId);

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: userId,
            email,
            company_name,
            full_name,
            role: 'user'
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  login = async (req: LoginRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw createError('Email and password are required', 400);
      }

      const connection = getConnection();

      // Get user
      const [users] = await connection.execute(
        'SELECT id, email, password, company_name, full_name, role, is_active FROM users WHERE email = ?',
        [email]
      ) as any[];

      if (!users.length) {
        throw createError('Invalid credentials', 401);
      }

      const user = users[0];

      if (!user.is_active) {
        throw createError('Account is deactivated', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw createError('Invalid credentials', 401);
      }

      // Generate tokens
      const token = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            company_name: user.company_name,
            full_name: user.full_name,
            role: user.role
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw createError('Refresh token is required', 400);
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const userId = decoded.userId;

      // Verify user still exists and is active
      const connection = getConnection();
      const [users] = await connection.execute(
        'SELECT id, is_active FROM users WHERE id = ?',
        [userId]
      ) as any[];

      if (!users.length || !users[0].is_active) {
        throw createError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const newToken = this.generateAccessToken(userId);
      const newRefreshToken = this.generateRefreshToken(userId);

      res.json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(createError('Invalid refresh token', 401));
      } else {
        next(error);
      }
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a production app, you might want to blacklist the token
      logger.info('User logged out');
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  getCurrentUser = async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const connection = getConnection();
      const [users] = await connection.execute(
        'SELECT id, email, company_name, full_name, role, is_active FROM users WHERE id = ?',
        [userId]
      ) as any[];

      if (!users.length || !users[0].is_active) {
        throw createError('User not found or deactivated', 404);
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: users[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }

  private generateAccessToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as SignOptions
    );
  }

  private generateRefreshToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as SignOptions
    );
  }
}

export const authController = new AuthController();