import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserWithProfile(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  async createOrUpdateProfile(
    userId: string,
    createUserProfileDto: CreateUserProfileDto,
  ) {
    // First ensure user exists
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: createUserProfileDto.email ?? '',
      },
    });

    // Then create or update profile
    const updateData: Prisma.UserProfileUpdateInput = {};
    const createData: Prisma.UserProfileCreateInput = {
      user: { connect: { id: userId } },
    };

    if (createUserProfileDto.displayName !== undefined) {
      updateData.displayName = createUserProfileDto.displayName;
      createData.displayName = createUserProfileDto.displayName;
    }
    if (createUserProfileDto.avatarUrl !== undefined) {
      updateData.avatar = createUserProfileDto.avatarUrl;
      createData.avatar = createUserProfileDto.avatarUrl;
    }
    if (createUserProfileDto.bio !== undefined) {
      updateData.bio = createUserProfileDto.bio;
      createData.bio = createUserProfileDto.bio;
    }
    if (createUserProfileDto.preferences !== undefined) {
      updateData.preferences = createUserProfileDto.preferences;
      createData.preferences = createUserProfileDto.preferences;
    }

    return await this.prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });
  }
}
