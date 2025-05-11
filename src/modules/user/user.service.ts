import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RepositoryService } from '../common/services/repository/repository.service';

@Injectable()
export class UserService extends RepositoryService<User> {
    constructor(
        @InjectRepository(User) 
        repository: Repository<User>,
    ) {
        super(repository);
    }
}
