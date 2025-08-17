/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import type { AuthUser } from '@chat-mate/types';
// Using Jest for mocking

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;

  const mockUsersService = {
    findUserWithProfile: jest.fn(),
    createOrUpdateProfile: jest.fn(),
  };

  const mockUser: AuthUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  const mockUserWithProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-id',
      userId: 'test-user-id',
      displayName: 'Test User',
      avatar: 'avatar-url',
      bio: 'Test bio',
      preferences: {} as Record<string, unknown>,
    },
  };

  const mockProfile = {
    id: 'profile-id',
    userId: 'test-user-id',
    displayName: 'Test User',
    avatar: 'avatar-url',
    bio: 'Test bio',
    preferences: {} as Record<string, unknown>,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = mockUsersService;

    // Directly assign the mock to ensure it's available
    (controller as any).usersService = mockUsersService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      usersService.findUserWithProfile.mockResolvedValue(mockUserWithProfile);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual({ success: true, data: mockUserWithProfile });
      expect(usersService.findUserWithProfile).toHaveBeenCalledWith(
        mockUser.id
      );
    });

    it('should handle user not found', async () => {
      usersService.findUserWithProfile.mockResolvedValue(null);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual({ success: true, data: null });
      expect(usersService.findUserWithProfile).toHaveBeenCalledWith(
        mockUser.id
      );
    });
  });

  describe('createOrUpdateProfile', () => {
    const createProfileDto: CreateUserProfileDto = {
      displayName: 'Updated Name',
      bio: 'Updated bio',
    };

    it('should create or update profile', async () => {
      const updatedProfile = { ...mockProfile, ...createProfileDto };
      usersService.createOrUpdateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.createOrUpdateProfile(
        mockRequest,
        createProfileDto
      );

      expect(result).toEqual(updatedProfile);
      expect(usersService.createOrUpdateProfile).toHaveBeenCalledWith(
        mockUser.id,
        createProfileDto
      );
    });
  });

  describe('getUser', () => {
    const targetUserId = 'target-user-id';

    it('should return user by id', async () => {
      const targetUserProfile = {
        ...mockUserWithProfile,
        id: targetUserId,
      };
      usersService.findUserWithProfile.mockResolvedValue(targetUserProfile);

      const result = await controller.getUser(targetUserId);

      expect(result).toEqual(targetUserProfile);
      expect(usersService.findUserWithProfile).toHaveBeenCalledWith(
        targetUserId
      );
    });

    it('should handle user not found', async () => {
      usersService.findUserWithProfile.mockResolvedValue(null);

      const result = await controller.getUser(targetUserId);

      expect(result).toBeNull();
      expect(usersService.findUserWithProfile).toHaveBeenCalledWith(
        targetUserId
      );
    });
  });
});
