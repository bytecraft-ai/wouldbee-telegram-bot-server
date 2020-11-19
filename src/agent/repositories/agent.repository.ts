import { EntityRepository, Repository } from "typeorm";
import { WbAgent } from "../entities/agent.entity";

@EntityRepository(WbAgent)
export class AgentRepository extends Repository<WbAgent> {

}