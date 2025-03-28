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

    // Filter by search term
    if (filters.searchTerm) {
      query.andWhere('LOWER(job.title) LIKE LOWER(:searchTerm)', {
        searchTerm: `%${filters.searchTerm}%`,
      });
    }

    // Filter by location with case-insensitive match
    if (filters.location) {
      query.andWhere('LOWER(TRIM(job.location)) LIKE LOWER(TRIM(:location))', {
        location: `%${filters.location}%`, // Use LIKE for partial matches
      });
    }

    // Filter by job type (Handle spaces, case, and variations)
    if (filters.jobType) {
      query.andWhere(
        "LOWER(REPLACE(job.jobType, ' ', '')) = LOWER(REPLACE(:jobType, ' ', ''))",
        {
          jobType: filters.jobType.replace(/\s+/g, ''), // Normalize input job type
        },
      );
    }

    if (filters.salaryRange) {
      const [minSalary, maxSalary] = filters.salaryRange.split(',').map((value) => parseInt(value) * 1000);
      query.andWhere('job.salaryRange BETWEEN :minSalary AND :maxSalary', {
        minSalary,
        maxSalary,
      });
    }

    const jobs = await query.getMany();


    return jobs;
  }
}
