import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entity/job.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    file: Express.Multer.File,
  ): Promise<Job> {
    const applicationDeadline = new Date(createJobDto.applicationDeadline);
  
    const job = new Job();
    Object.assign(job, createJobDto);
    if (file) {
      job.companyProfilePhoto = await this.cloudinaryService.uploadImage(file);
    }
  
    job.applicationDeadline = applicationDeadline;
    job.createdAt = new Date(); // Manually set the createdAt field
  
    return this.jobsRepository.save(job);
  }

  async findAll(filters: {
    searchTerm?: string;
    location?: string;
    jobType?: string;
    salaryRange?: string;
  }): Promise<Job[]> {
    const query = this.jobsRepository.createQueryBuilder('job');

    if (filters.searchTerm) {
      query.andWhere('job.title ILIKE :searchTerm', { searchTerm: `%${filters.searchTerm}%` });
    }

    if (filters.location) {
      query.andWhere('job.location = :location', { location: filters.location });
    }

    if (filters.jobType) {
      query.andWhere('job.jobType = :jobType', { jobType: filters.jobType });
    }

    if (filters.salaryRange) {
      const [minSalary, maxSalary] = filters.salaryRange.split(',').map(Number);
      query.andWhere('job.salaryRange BETWEEN :minSalary AND :maxSalary', { minSalary, maxSalary });
    }

    return query.getMany();
  }
}
