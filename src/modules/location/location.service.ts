import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './location.entity';
import { RepositoryService } from '../common/services/repository/repository.service';

@Injectable()
export class LocationService extends RepositoryService<Location> {
    constructor(
        @InjectRepository(Location) 
        repository: Repository<Location>,
    ) {
        super(repository);
    }
}
