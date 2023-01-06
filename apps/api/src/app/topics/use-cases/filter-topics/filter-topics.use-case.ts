import { BadRequestException, Injectable } from '@nestjs/common';
import { EnvironmentId, OrganizationId, TopicEntity, TopicRepository } from '@novu/dal';

import { FilterTopicsCommand } from './filter-topics.command';

import { TopicDto } from '../../dtos/topic.dto';
import { ExternalSubscriberId } from '../../types';

const DEFAULT_TOPIC_LIMIT = 10;

@Injectable()
export class FilterTopicsUseCase {
  constructor(private topicRepository: TopicRepository) {}

  async execute(command: FilterTopicsCommand) {
    const { pageSize = DEFAULT_TOPIC_LIMIT, page = 0 } = command;

    if (pageSize > DEFAULT_TOPIC_LIMIT) {
      throw new BadRequestException(`Page size can not be larger then ${DEFAULT_TOPIC_LIMIT}`);
    }

    const query = this.mapFromCommandToEntity(command);

    const totalCount = await this.topicRepository.count(query);

    const pagination = {
      limit: pageSize,
      skip: page * pageSize,
    };
    const filteredTopics = await this.topicRepository.filterTopics(query, pagination);

    return {
      page,
      totalCount,
      pageSize,
      data: filteredTopics.map(this.mapFromEntityToDto),
    };
  }

  private mapFromCommandToEntity(
    command: FilterTopicsCommand
  ): Pick<TopicEntity, '_environmentId' | 'key' | '_organizationId'> {
    return {
      _environmentId: TopicRepository.convertStringToObjectId(command.environmentId),
      _organizationId: TopicRepository.convertStringToObjectId(command.organizationId),
      ...(command.key && { key: command.key }),
    } as Pick<TopicEntity, '_environmentId' | 'key' | '_organizationId'>;
  }

  private mapFromEntityToDto(topic: TopicEntity & { subscribers: ExternalSubscriberId[] }): TopicDto {
    return {
      ...topic,
      _id: TopicRepository.convertObjectIdToString(topic._id),
      _organizationId: TopicRepository.convertObjectIdToString(topic._organizationId),
      _environmentId: TopicRepository.convertObjectIdToString(topic._environmentId),
    };
  }
}
