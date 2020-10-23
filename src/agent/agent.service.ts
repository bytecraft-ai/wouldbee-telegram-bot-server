import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgentChangePasswordDto, AgentRegistrationDto, AgentSignInDto } from './dto/agent-register.dto';
import { Agent } from './entities/agent.entity';
import { AgentRepository } from './repositories/agent.repository';
import { genSalt, hash } from 'bcryptjs';

const logger = new Logger('AgentService');

@Injectable()
export class AgentService {
    constructor(
        @InjectRepository(AgentRepository)
        private agentRepository: AgentRepository
    ) { }


    async getAgentById(id: string, { throwOnFail = false }): Promise<Agent> {
        const agent = await this.agentRepository.findOne(id);
        if (!agent && throwOnFail) {
            throw new NotFoundException(`Agent with id: ${id} not found!`);
        }
        return agent;
    }


    async getAgentByEmail(email: string, { throwOnFail = false }): Promise<Agent> {
        const agent = await this.agentRepository.findOne({
            where: { email: email.toLowerCase().trim() },
        });
        if (!agent && throwOnFail) {
            throw new NotFoundException(`Agent with email: ${email} not found!`);
        }
        return agent;
    }


    async getAgents(): Promise<Agent[]> {
        return this.agentRepository.find();
    }


    async registerAgent(registrationDto: AgentRegistrationDto): Promise<Agent> {
        console.log('registrationDto:', registrationDto);
        let agent = await this.agentRepository.findOne({
            where: [
                { email: registrationDto.email.toLowerCase().trim() },
                { phone: registrationDto.phone.trim() },
            ]
        });

        if (agent) {
            throw new ConflictException('Agent already exists!')
        }

        const salt = await genSalt();
        agent = this.agentRepository.create({
            name: registrationDto.name.trim(),
            email: registrationDto.email.toLowerCase().trim(),
            phone: registrationDto.phone,
            salt: salt,
            password: await hash(registrationDto.password.trim(), salt),
            role: registrationDto.role
        });

        return this.agentRepository.save(agent);

    }


    async validateAgent(authInput: AgentSignInDto): Promise<Agent | null> {
        let { email, password } = authInput;

        email = email.trim().toLowerCase();
        password = password.trim();

        let agent = await this.getAgentByEmail(email, { throwOnFail: false });

        if (agent && await agent.validatePassword(password)) {
            // agent = await this.updateLastSeen(agent);
            return agent;
        } else {
            return null;
        }
    }


    async resetAgentPassword(changePasswordInput: AgentChangePasswordDto, currentAgent: Agent): Promise<Agent | undefined> {

        const { oldPassword, newPassword } = changePasswordInput;
        const signInInput = new AgentSignInDto();
        signInInput.email = currentAgent.email;
        signInInput.password = oldPassword;
        const agent = await this.validateAgent(signInInput);

        if (agent) {
            agent.salt = await genSalt();
            agent.password = await hash(newPassword, agent.salt);
        }

        logger.log(`Password changed for agent with id - ${agent.id}`);
        const savedAgent = await this.agentRepository.save(agent);

        return savedAgent;
    }

}
