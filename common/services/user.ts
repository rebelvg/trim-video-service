import { userRepository } from '../repositories/user';
import { IUser } from '../models/user';

class UserService {
  public async create(): Promise<IUser> {
    const userId = await userRepository.create();

    return userRepository.findOne({
      _id: userId,
    });
  }

  public findByToken(token: string): Promise<IUser> {
    return userRepository.findOne({ token });
  }
}

export const userService = new UserService();
