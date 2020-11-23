import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { readFileSync } from 'fs';
import { AgentService } from 'src/agent/agent.service';
import { AgentRegistrationDto } from 'src/agent/dto/agent-register.dto';
import { Religion, UserRole } from 'src/common/enum';
import { ProfileService } from 'src/profile/profile.service';

const logger = new Logger('SeederService');

const countriesToSeed = ['india', 'australia', 'canada', 'france', 'germany', 'new zealand', 'singapore', 'united states', 'united kingdom'];
// ['india', 'canada', 'united states', 'argentina', 'chile', 'australia', 'new zealand', 'finland', 'sweden', 'denmark', 'norway', 'united kingdom', 'portugal', 'spain', 'france', 'germany', 'netherlands the', 'switzerland', 'austria', 'belgium', 'czech republic', 'ireland', 'poland', 'russia', 'brunei', 'oman', 'qatar', 'saudi arabia', 'south africa', 'united arab emirates', 'china', 'nepal', 'japan', 'korea south', 'singapore'];


@Injectable()
export class SeederService implements OnApplicationBootstrap {
    constructor(
        private readonly profileService: ProfileService,
        private readonly agentService: AgentService
    ) { }

    async onApplicationBootstrap() {
        try {
            logger.log('seeding agents ...');
            await this.seedAgents();

            logger.log('seeding castes ...');
            await this.seedCaste();

            logger.log('seeding locations ...');
            await this.seedLocation();

            logger.log('Done.');
        }
        catch (error) {
            logger.error('Error occurred while seeding agents, castes, and locations.');
        }

    }

    private getReligionEnum(religion: string): Religion | undefined {
        switch (religion) {
            case 'hindu': return Religion.HINDU;
            case 'jain:digamber': return Religion.JAIN_DASH_SHWETAMBER;
            case 'jain:shwetamber': return Religion.JAIN_DASH_SHWETAMBER;
            case 'sikh': return Religion.SIKH;
            case 'christian': return Religion.CHRISTIAN;
            case 'muslim:shia': return Religion.MUSLIM_DASH_SHIA;
            case 'muslim:sunni': return Religion.MUSLIM_DASH_SUNNI;
            default: return;
        }
    }


    async seedCaste() {
        const casteData = JSON.parse(
            readFileSync("assets/caste.data.json").toString()
        );
        const data = casteData.data;

        const existingCastes = this.profileService.getCastesLike('', 0, 100);

        for (let i = 0; i < data.length; i++) {
            if (data[i].religion.startsWith('_')) {
                continue
            }
            const religion = this.getReligionEnum(data[i].religion);
            const castes = data[i].castes;
            await this.profileService.createCastes(castes, religion);
        }

        logger.log('Castes seeded.');
    }


    async seedLocation(jsonFileLocation: string = 'assets/countries+states+cities.json') {
        const data = JSON.parse(
            '{\n"countries": ' + readFileSync(jsonFileLocation).toString() + '\n}'
        );

        const existingCountries = (await this.profileService.getCountries())
            .map(country => country.name.toLocaleLowerCase());

        console.log('countriesToSeed:', countriesToSeed);
        // console.log('existingCountries:', existingCountries);

        const countries = data.countries;
        for await (let country of countries) {
            if (!countriesToSeed.includes(country['name'].toLocaleLowerCase()))
                continue
            else if (existingCountries.includes(country['name'].toLocaleLowerCase()))
                continue
            else {
                console.log(country["name"].toLocaleLowerCase(), country["phone_code"]);
                await this.profileService.createCountry(country);
                // console.log('country-id:', country["id"]);
                await this.profileService.createStates(country["states"], country["id"]);
                for await (let state of country["states"]) {
                    // console.log('state-id:', state["id"]);
                    await this.profileService.createCities(state["cities"], state["id"]);
                }
            }
        }
        logger.log('Locations seeded.');
    }


    async seedAgents() {
        const rahul: AgentRegistrationDto = {
            email: "rahul@wouldbee.com",
            phone: "9611121073",
            name: "Rahul Gupta",
            password: process.env.NODE_ENV === 'production' ? 'bahuthi-mushkill' : "Password-1",
            role: UserRole.ADMIN
        };
        const charul: AgentRegistrationDto = {
            email: "charul@wouldbee.com",
            phone: "97030726206",
            name: "Kritika Agrawal",
            password: "Password-1",
            role: UserRole.AGENT
        };
        const tanu: AgentRegistrationDto = {
            email: "tanugupta17@gmail.com",
            phone: "7023400244",
            name: "Tanuja Gupta",
            password: "Password-1",
            role: UserRole.AGENT
        };
        const yash: AgentRegistrationDto = {
            email: "yashsharma170898@gmail.com",
            phone: "8910719147",
            name: "Yash Sharma",
            password: "Password-1",
            role: UserRole.AGENT
        };
        const utkarsh: AgentRegistrationDto = {
            email: "u.b.27031990@gmail.com",
            phone: "8130168109",
            name: "Utkarsh Bhatnagar",
            password: process.env.NODE_ENV === 'production' ? 'kathin-passw0rd' : "Password-1",
            role: UserRole.AGENT
        };

        process.env.NODE_ENV === 'production' ? true : true

        const admins = process.env.NODE_ENV === 'production' ? [rahul, utkarsh] : [rahul, charul, tanu, yash, utkarsh];
        let admin = rahul;

        try {
            for await (admin of admins) {
                const existingAgentEmails = (await this.agentService.getAgents())
                    .map(agent => agent.email);
                if (!existingAgentEmails.includes(admin.email)) {
                    await this.agentService.registerAgent(admin);
                }
            }
        } catch (err) {
            logger.log(`Could not init Admin: ${admin}. Error: ${err}`);
        }
        logger.log('Agents seeded.');
    }

}
