import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Religion } from 'src/common/enum';
import { ProfileService } from 'src/profile/profile.service';

const countriesToSeed = ['nepal'];
// ['india', 'canada', 'united states', 'argentina', 'chile', 'australia', 'new zealand', 'finland', 'sweden', 'denmark', 'norway', 'united kingdom', 'portugal', 'spain', 'france', 'germany', 'netherlands the', 'switzerland', 'austria', 'belgium', 'czech republic', 'ireland', 'poland', 'russia', 'brunei', 'oman', 'qatar', 'saudi arabia', 'south africa', 'united arab emirates', 'china', 'nepal', 'japan', 'korea south', 'singapore'];


@Injectable()
export class SeederService {
    constructor(
        private readonly profileService: ProfileService
    ) { }


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
        for (let i = 0; i < data.length; i++) {
            if (data[i].religion.startsWith('_')) {
                continue
            }
            const religion = this.getReligionEnum(data[i].religion);
            const castes = data[i].castes;
            await this.profileService.createCastes(castes, religion);
        }
    }


    async seedLocation(jsonFileLocation: string = 'assets/countries+states+cities.json') {
        const data = JSON.parse(
            '{\n"countries": ' + readFileSync(jsonFileLocation).toString() + '\n}'
        );

        const countries = data.countries;
        for await (let country of countries) {
            if (countriesToSeed.includes(country['name'].toLowerCase()))
                continue
            else {
                console.log(country["name"].toLowerCase(), country["phone_code"]);
                await this.profileService.createCountry(country);
                // console.log('country-id:', country["id"]);
                await this.profileService.createStates(country["states"], country["id"]);
                for await (let state of country["states"]) {
                    // console.log('state-id:', state["id"]);
                    await this.profileService.createCities(state["cities"], state["id"]);
                }
            }

        }
    }
}
