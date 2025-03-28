import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entity/job.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('companyProfilePhoto'))
  async create(
    @Body() createJobDto: CreateJobDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Job> {
    return this.jobsService.create(createJobDto, file);
  }
  @Get()
  findAll(
    @Query('searchTerm') searchTerm: string,
    @Query('location') location: string,
    @Query('jobType') jobType: string,
    @Query('salaryRange') salaryRange: string,
  ): Promise<Job[]> {
    return this.jobsService.findAll({
      searchTerm,
      location,
      jobType,
      salaryRange,
    });
  }
}
